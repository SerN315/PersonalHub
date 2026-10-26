// The rules of the Focus timer, as plain functions (no React, no browser) so they can be tested on their own.

export type Mode = "focus" | "short" | "long";
export const MODES: Mode[] = ["focus", "short", "long"];

export interface Settings {
  focus: number; // minutes
  short: number;
  long: number;
  longEvery: number; // a long break after this many finished focus sessions
  autoStart: boolean; // start the next session by itself
  sound: boolean;
  notify: boolean; // a browser notification when a session ends (the person has to allow it)
}

export const DEFAULT_SETTINGS: Settings = { focus: 25, short: 5, long: 15, longEvery: 4, autoStart: false, sound: true, notify: false };

const LIMITS = { focus: [1, 120], short: [1, 60], long: [1, 90], longEvery: [2, 8] } as const;
const clampInt = (value: unknown, [min, max]: readonly [number, number], fallback: number) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

// Anything (localStorage, an old version) in, valid settings out.
export function cleanSettings(raw: unknown): Settings {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    focus: clampInt(r.focus, LIMITS.focus, DEFAULT_SETTINGS.focus),
    short: clampInt(r.short, LIMITS.short, DEFAULT_SETTINGS.short),
    long: clampInt(r.long, LIMITS.long, DEFAULT_SETTINGS.long),
    longEvery: clampInt(r.longEvery, LIMITS.longEvery, DEFAULT_SETTINGS.longEvery),
    autoStart: r.autoStart === true,
    sound: r.sound !== false,
    notify: r.notify === true,
  };
}

export const secondsFor = (mode: Mode, settings: Settings) => settings[mode] * 60;

// What comes after a session. `finishedFocus` is how many focus sessions have been completed in this round (including the one that just
// ended, when it was a focus session). After a break the round carries on; after the long break it starts again from zero.
export function nextMode(mode: Mode, finishedFocus: number, settings: Settings): { mode: Mode; finishedFocus: number } {
  if (mode === "focus") return { mode: finishedFocus >= settings.longEvery ? "long" : "short", finishedFocus };
  return { mode: "focus", finishedFocus: mode === "long" ? 0 : finishedFocus };
}

export const remainingSeconds = (endsAt: number, now: number) => Math.max(0, Math.ceil((endsAt - now) / 1000));

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}

// How much sand is in the top bulb (1 = full, 0 = empty), from how far through the session we are.
export const sandLeft = (remaining: number, total: number) => (total <= 0 ? 0 : Math.min(1, Math.max(0, remaining / total)));

// A session that was stopped early is only worth saving if it ran for at least a minute (and it can never be longer than planned).
export function worthSaving(spentSeconds: number, plannedSeconds: number) {
  const actual = Math.min(Math.max(0, Math.round(spentSeconds)), plannedSeconds + 120);
  return actual >= 60 ? actual : null;
}
