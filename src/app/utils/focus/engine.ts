import { useEffect } from "react";
import { create } from "zustand";
import { ApiError } from "@/app/apis/http";
import { saveSession, type SessionToSave } from "@/app/apis/focus";
import { DEFAULT_SETTINGS, cleanSettings, nextMode, remainingSeconds, secondsFor, worthSaving, type Mode, type Settings } from "./timer";

// The Focus timer's engine. It lives OUTSIDE React on purpose (like the radio): the countdown belongs to the page, not to a widget, so the
// Board's Pomodoro widget, the Focus tab and the Room's hourglass all show the same running timer, and it carries on while you move around.
//
//  - It remembers an END TIME, never "seconds left", so a throttled background tab or a sleeping laptop can't make it drift.
//  - It is saved in this browser (localStorage), so a reload picks up where you were, and another tab follows the same timer.
//  - A finished focus session is sent to your account once: the browser invents the session's id, so a retry or a second tab saving the
//    same session can't count it twice. If you are offline the session waits in an outbox and is sent later.

const STATE_KEY = "personalhub:focus-v1";
const DONE_KEY = "personalhub:focus-done";
const OUTBOX_KEY = "personalhub:focus-outbox";
const STALE_AFTER_MS = 15 * 60 * 1000; // a timer found over 15 minutes past its end was left behind: it is dropped, not counted

export type Status = "idle" | "running" | "paused";
export interface Task {
  id: string;
  label: string;
}

interface Persisted {
  mode: Mode;
  status: Status;
  endsAt: number | null;
  leftSecs: number;
  plannedSecs: number;
  startedAt: number | null;
  sessionId: string | null;
  finishedFocus: number;
  task: Task | null;
  settings: Settings;
}

interface FocusState extends Persisted {
  nowMs: number; // moves on while a session runs, so the screen can count down
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  choose: (mode: Mode) => void;
  setTask: (task: Task | null) => void;
  setSettings: (patch: Partial<Settings>) => void;
}

const idle = (mode: Mode, settings: Settings) => ({
  mode,
  status: "idle" as Status,
  endsAt: null,
  leftSecs: secondsFor(mode, settings),
  plannedSecs: secondsFor(mode, settings),
  startedAt: null,
  sessionId: null,
});

const fresh = (): Persisted => ({ ...idle("focus", DEFAULT_SETTINGS), finishedFocus: 0, task: null, settings: DEFAULT_SETTINGS });

// ---- storage (every read is checked: it is untrusted text) ---------------------------------------------------------------------------------

const isTask = (value: unknown): value is Task => !!value && typeof (value as Task).id === "string" && typeof (value as Task).label === "string";

export function parseStored(raw: string | null): Persisted | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Record<string, unknown>;
    const settings = cleanSettings(r.settings);
    const mode: Mode = r.mode === "short" || r.mode === "long" ? r.mode : "focus";
    const status: Status = r.status === "running" || r.status === "paused" ? r.status : "idle";
    const planned = Math.min(10800, Math.max(60, Number(r.plannedSecs) || secondsFor(mode, settings)));
    const left = Math.min(planned, Math.max(0, Number(r.leftSecs) || 0));
    const running = status === "running" && Number.isFinite(Number(r.endsAt));
    const live = running || status === "paused";
    return {
      mode,
      status: running ? "running" : status === "paused" ? "paused" : "idle",
      endsAt: running ? Number(r.endsAt) : null,
      leftSecs: live ? left : secondsFor(mode, settings),
      plannedSecs: live ? planned : secondsFor(mode, settings),
      startedAt: live && Number.isFinite(Number(r.startedAt)) ? Number(r.startedAt) : null,
      sessionId: live && typeof r.sessionId === "string" && r.sessionId.length <= 40 ? r.sessionId : null,
      finishedFocus: Math.min(20, Math.max(0, Math.round(Number(r.finishedFocus) || 0))),
      task: isTask(r.task) ? { id: r.task.id.slice(0, 40), label: r.task.label.slice(0, 120) } : null,
      settings,
    };
  } catch {
    return null;
  }
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private window: it just does not survive a reload */
  }
};

// ---- sound and notifications ----------------------------------------------------------------------------------------------------------------

let audio: AudioContext | null = null;
// Browsers only allow sound after a tap or click, so the first press of Start prepares it.
function unlockAudio() {
  try {
    audio ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    /* no audio: the notification and the screen still tell you */
  }
}
function chime() {
  const context = audio;
  if (!context) return;
  const begin = context.currentTime + 0.02;
  [659.25, 880, 1318.5].forEach((hz, i) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = hz;
    const at = begin + i * 0.28;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.16, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
    osc.connect(gain).connect(context.destination);
    osc.start(at);
    osc.stop(at + 1.2);
  });
}
export const playChime = () => {
  unlockAudio();
  chime();
};
function notify(title: string, body: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body, tag: "personalhub-focus", silent: true });
  } catch {
    /* some browsers only allow it from a service worker: fine */
  }
}
export async function askToNotify() {
  try {
    return typeof Notification === "undefined" ? "denied" : await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

// ---- saving finished sessions ------------------------------------------------------------------------------------------------------------------

function outbox(): SessionToSave[] {
  try {
    const list = JSON.parse(read(OUTBOX_KEY) ?? "[]");
    return Array.isArray(list) ? list.slice(0, 30) : [];
  } catch {
    return [];
  }
}
const putOutbox = (list: SessionToSave[]) => write(OUTBOX_KEY, JSON.stringify(list.slice(-30)));

let flushing = false;
export async function flushOutbox() {
  if (flushing) return;
  flushing = true;
  try {
    for (const session of outbox()) {
      try {
        await saveSession(session);
      } catch (error) {
        // a refusal (the server looked at it and said no) is final; a network problem or being signed out is worth another try later
        if (!(error instanceof ApiError) || error.status === 0 || error.status === 401 || error.status >= 500 || error.status === 429) break;
      }
      putOutbox(outbox().filter((s) => s.id !== session.id));
    }
  } finally {
    flushing = false;
  }
}
function keepSession(s: SessionToSave) {
  putOutbox([...outbox().filter((x) => x.id !== s.id), s]);
  void flushOutbox();
}

// ---- the store -------------------------------------------------------------------------------------------------------------------------------------

export const useFocusStore = create<FocusState>((set, get) => ({
  ...fresh(),
  nowMs: 0,

  start: () => {
    unlockAudio();
    const s = get();
    if (s.status === "running") return;
    const now = Date.now();
    const resuming = s.status === "paused";
    set({ status: "running", endsAt: now + s.leftSecs * 1000, startedAt: resuming ? s.startedAt : now, sessionId: resuming ? s.sessionId : crypto.randomUUID(), nowMs: now });
    persist();
    schedule();
  },

  pause: () => {
    const s = get();
    if (s.status !== "running" || s.endsAt === null) return;
    set({ status: "paused", leftSecs: remainingSeconds(s.endsAt, Date.now()), endsAt: null, nowMs: Date.now() });
    persist();
    schedule();
  },

  // Give the session up. If it ran for a while, what you did is still kept.
  reset: () => {
    const s = get();
    const record = sessionRecord(false, spentSecs(s));
    if (record) keepSession(record);
    set({ ...idle(s.mode, s.settings), nowMs: Date.now() });
    persist();
    schedule();
  },

  // Move on to the next part without finishing this one (it does not count towards the round).
  skip: () => {
    const s = get();
    const record = sessionRecord(false, spentSecs(s));
    if (record) keepSession(record);
    const next = nextMode(s.mode, s.finishedFocus, s.settings);
    set({ ...idle(next.mode, s.settings), finishedFocus: next.finishedFocus, nowMs: Date.now() });
    persist();
    schedule();
  },

  choose: (mode) => {
    const s = get();
    if (s.status === "running" || s.mode === mode) return;
    set({ ...idle(mode, s.settings), nowMs: Date.now() });
    persist();
  },

  setTask: (task) => {
    set({ task });
    persist();
  },

  setSettings: (patch) => {
    const s = get();
    const settings = cleanSettings({ ...s.settings, ...patch });
    // a change of length only applies to a session that has not started
    set(s.status === "idle" ? { settings, ...idle(s.mode, settings) } : { settings });
    persist();
  },
}));

const spentSecs = (s: Persisted) => (s.status === "idle" ? 0 : s.plannedSecs - (s.endsAt ? remainingSeconds(s.endsAt, Date.now()) : s.leftSecs));

function persist() {
  const s = useFocusStore.getState();
  const data: Persisted = { mode: s.mode, status: s.status, endsAt: s.endsAt, leftSecs: s.leftSecs, plannedSecs: s.plannedSecs, startedAt: s.startedAt, sessionId: s.sessionId, finishedFocus: s.finishedFocus, task: s.task, settings: s.settings };
  write(STATE_KEY, JSON.stringify(data));
}

let timeout: ReturnType<typeof setTimeout> | undefined;
let ticker: ReturnType<typeof setInterval> | undefined;

// One timeout for the moment the session ends, plus a half-second ticker for the screen while it runs.
function schedule() {
  clearTimeout(timeout);
  clearInterval(ticker);
  const { status, endsAt } = useFocusStore.getState();
  if (status !== "running" || endsAt === null) return;
  timeout = setTimeout(check, Math.min(Math.max(0, endsAt - Date.now()) + 30, 2_000_000_000));
  ticker = setInterval(() => useFocusStore.setState({ nowMs: Date.now() }), 500);
}

// Whatever the clock says, trust only the end time.
function check() {
  const { status, endsAt } = useFocusStore.getState();
  if (status !== "running" || endsAt === null) return;
  if (Date.now() >= endsAt) complete(false);
  else schedule();
}

function sessionRecord(completed: boolean, spent: number): SessionToSave | null {
  const s = useFocusStore.getState();
  if (s.mode !== "focus" || !s.sessionId || s.startedAt === null) return null; // breaks are not worth keeping
  const actual = completed ? s.plannedSecs : worthSaving(spent, s.plannedSecs);
  if (actual === null) return null;
  return { id: s.sessionId, kind: "focus", planned_secs: s.plannedSecs, actual_secs: actual, completed, started_at: new Date(s.startedAt).toISOString(), task_id: s.task?.id ?? null, task_label: s.task?.label ?? null };
}

// The session reached its end. `late` is true when the page only noticed afterwards (it was closed or asleep): it still counts, but it
// does not chime or start the next one.
function complete(late: boolean) {
  const before = useFocusStore.getState();
  const record = sessionRecord(true, before.plannedSecs);
  if (record) keepSession(record);
  // only one tab should chime and notify
  const first = read(DONE_KEY) !== before.sessionId;
  if (before.sessionId) write(DONE_KEY, before.sessionId);
  const finished = before.finishedFocus + (before.mode === "focus" ? 1 : 0);
  const next = nextMode(before.mode, finished, before.settings);
  useFocusStore.setState({ ...idle(next.mode, before.settings), finishedFocus: next.finishedFocus, nowMs: Date.now() });
  persist();
  schedule();
  if (first && !late) {
    if (before.settings.sound) chime();
    if (before.settings.notify) notify(before.mode === "focus" ? "Focus session done" : "Break over", before.mode === "focus" ? "Nicely done. Time to rest your eyes." : "Ready for the next one when you are.");
  }
  if (before.settings.autoStart && !late) useFocusStore.getState().start();
}

// ---- starting up and waking up --------------------------------------------------------------------------------------------------------------------

// Look at what this browser remembers, and carry on from there. It runs after the page has mounted (never during the first render), so the
// server's page and the browser's first paint always agree.
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  const stored = parseStored(read(STATE_KEY));
  if (stored) useFocusStore.setState({ ...stored, nowMs: Date.now() });
  settle();

  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && settle());
  window.addEventListener("online", () => void flushOutbox());
  // another tab changed the timer: follow it
  window.addEventListener("storage", (event) => {
    if (event.key !== STATE_KEY) return;
    const next = parseStored(event.newValue);
    if (next) {
      useFocusStore.setState({ ...next, nowMs: Date.now() });
      schedule();
    }
  });
  void flushOutbox();
}

// A timer that ended while nobody was looking is counted if it was only just now, and dropped if it was left long ago.
function settle() {
  const s = useFocusStore.getState();
  if (s.status === "running" && s.endsAt !== null && Date.now() >= s.endsAt) {
    if (Date.now() - s.endsAt > STALE_AFTER_MS) {
      useFocusStore.setState({ ...idle(s.mode, s.settings), nowMs: Date.now() });
      persist();
    } else {
      complete(true);
    }
  }
  schedule();
}

// Components call this once; it is safe to call from many.
export function useFocusBoot() {
  useEffect(boot, []);
}

// What the screen shows: seconds left, for a running, paused or waiting timer.
export const selectRemaining = (s: Pick<FocusState, "status" | "endsAt" | "leftSecs" | "nowMs">) => (s.status === "running" && s.endsAt !== null ? remainingSeconds(s.endsAt, s.nowMs) : s.leftSecs);
