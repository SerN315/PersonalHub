"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BasicIcon from "../ultis/icons";
import Hourglass from "./Hourglass";
import FocusStats from "./FocusStats";
import { KitchenTimer, Stopwatch, WorldClocks } from "./TimeDesk";
import { askToNotify, selectRemaining, useFocusBoot, useFocusStore } from "@/app/utils/focus/engine";
import { MODES, formatClock, sandLeft, type Mode } from "@/app/utils/focus/timer";
import { useTodoStore } from "@/app/utils/todo/store";
import { NO_FILTERS, selectTasks } from "@/app/utils/todo/views";
import "@/app/styles/pages/focus.scss";

const NAMES: Record<Mode, string> = { focus: "Focus", short: "Short break", long: "Long break" };

// what the heading says: a gentle word for where you are
const HEADLINE = (mode: Mode, status: "idle" | "running" | "paused") =>
  status === "paused" ? "Paused. No rush." : status === "idle" ? (mode === "focus" ? "Turn the hourglass when you are ready" : "Take a moment, then begin the break") : mode === "focus" ? "Stay with it" : mode === "short" ? "Rest your eyes" : "A proper breather";

function Settings() {
  const settings = useFocusStore((s) => s.settings);
  const setSettings = useFocusStore((s) => s.setSettings);
  const [asking, setAsking] = useState(false);
  const num = (key: "focus" | "short" | "long" | "longEvery", label: string, min: number, max: number) => (
    <label key={key}>
      {label}
      <input type="number" min={min} max={max} value={settings[key]} onChange={(e) => setSettings({ [key]: Number(e.target.value) })} />
    </label>
  );
  return (
    <details className="settings">
      <summary><BasicIcon icon="Settings02Icon" size={16} /> Timer settings</summary>
      <div className="settings__grid">
        {num("focus", "Focus (minutes)", 1, 120)}
        {num("short", "Short break", 1, 60)}
        {num("long", "Long break", 1, 90)}
        {num("longEvery", "Long break after", 2, 8)}
      </div>
      <label className="settings__check"><input type="checkbox" checked={settings.autoStart} onChange={(e) => setSettings({ autoStart: e.target.checked })} /> Start the next one by itself</label>
      <label className="settings__check"><input type="checkbox" checked={settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} /> Play a soft chime</label>
      <label className="settings__check">
        <input
          type="checkbox"
          checked={settings.notify}
          disabled={asking}
          onChange={async (e) => {
            if (!e.target.checked) return setSettings({ notify: false });
            setAsking(true);
            setSettings({ notify: (await askToNotify()) === "granted" });
            setAsking(false);
          }}
        />{" "}
        Tell me with a notification when a session ends
      </label>
      <p className="settings__fine">Notifications only appear while this page is open in your browser. A change to a length applies to the next session.</p>
    </details>
  );
}

// The Focus tab: a wooden desk with an hourglass you turn over to start, the round you are in, what you are working on, how it is going,
// and a small "time desk" (world clocks, stopwatch, kitchen timer). The timer itself is the shared engine, so it is the same one as the
// widget on My day and the hourglass in the Room.
export default function FocusDesk() {
  useFocusBoot();
  const mode = useFocusStore((s) => s.mode);
  const status = useFocusStore((s) => s.status);
  const planned = useFocusStore((s) => s.plannedSecs);
  const remaining = useFocusStore(selectRemaining);
  const finished = useFocusStore((s) => s.finishedFocus);
  const longEvery = useFocusStore((s) => s.settings.longEvery);
  const task = useFocusStore((s) => s.task);
  const start = useFocusStore((s) => s.start);
  const pause = useFocusStore((s) => s.pause);
  const reset = useFocusStore((s) => s.reset);
  const skip = useFocusStore((s) => s.skip);
  const choose = useFocusStore((s) => s.choose);
  const setTask = useFocusStore((s) => s.setTask);

  // your open tasks, to say what you are working on
  const tasks = useTodoStore((s) => s.tasks);
  const today = useTodoStore((s) => s.today);
  const loadTasks = useTodoStore((s) => s.load);
  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);
  const open = useMemo(() => selectTasks(tasks, { kind: "all" }, NO_FILTERS, today).slice(0, 60), [tasks, today]);

  const running = status === "running";
  const [turning, setTurning] = useState(false);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const press = () => {
    if (running) return pause();
    if (status === "idle") {
      setTurning(true);
      clearTimeout(turnTimer.current);
      turnTimer.current = setTimeout(() => setTurning(false), 1000);
    }
    start();
  };
  useEffect(() => () => clearTimeout(turnTimer.current), []);

  // the time in the browser tab's title while it runs
  useEffect(() => {
    const original = document.title;
    if (running) document.title = `${formatClock(remaining)} · ${NAMES[mode]}`;
    return () => {
      document.title = original;
    };
  }, [running, remaining, mode]);

  const sand = mode === "focus" || status !== "idle" ? sandLeft(remaining, planned) : 1;

  return (
    <div className="focus">
      <header className="focus__head">
        <p className="focus__eyebrow">Focus</p>
        <h1>{HEADLINE(mode, status)}</h1>
      </header>

      <div className="focus__grid">
        <section className="desk" aria-label="Timer">
          <div className="desk__modes" role="radiogroup" aria-label="Session type">
            {MODES.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} disabled={running && mode !== m} onClick={() => choose(m)}>{NAMES[m]}</button>
            ))}
          </div>

          <button type="button" className="desk__glass" onClick={press} aria-label={running ? "Pause the timer" : status === "paused" ? "Resume the timer" : "Turn the hourglass over and start"}>
            <Hourglass sand={sand} running={running} turning={turning} />
          </button>

          <p className="desk__time" role="timer" aria-live="off">{formatClock(remaining)}</p>
          <p className="desk__round" aria-label={`${finished} of ${longEvery} focus sessions finished in this round`}>
            {Array.from({ length: longEvery }, (_, i) => <i key={i} className={i < finished ? "is-done" : ""} />)}
          </p>

          <div className="desk__controls">
            <button type="button" className="desk__btn is-primary" onClick={press}>
              <BasicIcon icon={running ? "PauseIcon" : "PlayIcon"} size={18} /> {running ? "Pause" : status === "paused" ? "Resume" : "Start"}
            </button>
            <button type="button" className="desk__btn" onClick={reset} disabled={status === "idle"}><BasicIcon icon="RefreshIcon" size={16} /> Reset</button>
            <button type="button" className="desk__btn" onClick={skip}><BasicIcon icon="NextIcon" size={16} /> Skip</button>
          </div>

          <label className="desk__task">
            Working on
            <select value={task?.id ?? ""} onChange={(e) => { const found = open.find((t) => t.id === e.target.value); setTask(found ? { id: found.id, label: found.text.slice(0, 120) } : null); }} disabled={running && mode === "focus"}>
              <option value="">Nothing in particular</option>
              {task && !open.some((t) => t.id === task.id) && <option value={task.id}>{task.label}</option>}
              {open.map((t) => <option key={t.id} value={t.id}>{t.text.length > 60 ? `${t.text.slice(0, 57)}...` : t.text}</option>)}
            </select>
          </label>

          <Settings />
        </section>

        <div className="focus__side">
          <FocusStats />
          <WorldClocks />
          <Stopwatch />
          <KitchenTimer />
        </div>
      </div>
    </div>
  );
}
