"use client";
import React, { memo } from "react";
import BaseWidget from "./BaseWidget";
import BasicIcon from "../ultis/icons";
import WidgetProps from "@/app/types/widget";
import "../../styles/widgets/pomodoro.scss";
import { formatClock, MODES, type Mode } from "@/app/utils/focus/timer";
import { selectRemaining, useFocusBoot, useFocusStore } from "@/app/utils/focus/engine";

const LABELS: Record<Mode, { label: string; more?: string }> = {
  focus: { label: "Focus" },
  short: { label: "Short", more: " break" },
  long: { label: "Long", more: " break" },
};

const RING_RADIUS = 44;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// A calm countdown. It is the same timer as the Focus tab and the Room's hourglass (they share one engine), so it keeps running as you move
// around, and a reload picks it up where it was.
function PomodoroWidget(props: WidgetProps) {
  useFocusBoot();
  const mode = useFocusStore((s) => s.mode);
  const status = useFocusStore((s) => s.status);
  const total = useFocusStore((s) => s.plannedSecs);
  const remaining = useFocusStore(selectRemaining);
  const start = useFocusStore((s) => s.start);
  const pause = useFocusStore((s) => s.pause);
  const reset = useFocusStore((s) => s.reset);
  const choose = useFocusStore((s) => s.choose);

  const running = status === "running";
  const progress = total === 0 ? 0 : remaining / total;

  return (
    <BaseWidget title="Pomodoro" {...props}>
      <div className="pomo">
        <div className="pomo__modes" role="radiogroup" aria-label="Timer mode">
          {MODES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} disabled={running && mode !== m} className="pomo__mode" onClick={() => choose(m)}>
              {LABELS[m].label}
              {LABELS[m].more && <span className="pomo__more">{LABELS[m].more}</span>}
            </button>
          ))}
        </div>

        <div className="pomo__dial">
          <svg viewBox="0 0 100 100" className="pomo__ring" aria-hidden>
            <circle className="pomo__track" cx="50" cy="50" r={RING_RADIUS} />
            <circle className="pomo__progress" cx="50" cy="50" r={RING_RADIUS} strokeDasharray={RING_LENGTH} strokeDashoffset={RING_LENGTH * (1 - progress)} transform="rotate(-90 50 50)" />
          </svg>
          <div className="pomo__readout" role="timer" aria-live="off">
            <span className="pomo__time">{formatClock(remaining)}</span>
            <span className="pomo__hint">{running ? "Stay with it" : status === "paused" ? "Paused" : "Ready when you are"}</span>
          </div>
        </div>

        <div className="pomo__controls">
          <button type="button" className="pomo__play" onClick={running ? pause : start} aria-label={running ? "Pause" : "Start"}>
            <BasicIcon icon={running ? "PauseIcon" : "PlayIcon"} size={22} />
          </button>
          <button type="button" className="pomo__reset" onClick={reset} aria-label="Reset timer">
            <BasicIcon icon="RefreshIcon" size={18} />
          </button>
        </div>
      </div>
    </BaseWidget>
  );
}

export default memo(PomodoroWidget);
