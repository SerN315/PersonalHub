"use client";
import React, { memo, useEffect, useState } from "react";
import BaseWidget from "./BaseWidget";
import BasicIcon from "../ultis/icons";
import WidgetProps from "@/app/types/widget";
import "../../styles/widgets/pomodoro.scss";
import { formatTime } from "@/app/utils/commonUltis";

const MODES = [
  { key: "focus", label: "Focus", seconds: 25 * 60 },
  { key: "short", label: "Short break", seconds: 5 * 60 },
  { key: "long", label: "Long break", seconds: 15 * 60 },
] as const;
type ModeKey = (typeof MODES)[number]["key"];

const RING_RADIUS = 44;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// A calm countdown. The end time is remembered (not "seconds left"), so a throttled background tab never drifts.
function PomodoroWidget(props: WidgetProps) {
  const [modeKey, setModeKey] = useState<ModeKey>("focus");
  const total = MODES.find((m) => m.key === modeKey)!.seconds;
  const [timeLeft, setTimeLeft] = useState<number>(total);
  const [endAt, setEndAt] = useState<number | null>(null); // set while running
  const running = endAt !== null;

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) setEndAt(null);
    };
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [endAt]);

  const choose = (key: ModeKey) => {
    setModeKey(key);
    setEndAt(null);
    setTimeLeft(MODES.find((m) => m.key === key)!.seconds);
  };
  const toggle = () => {
    if (running) {
      setEndAt(null);
    } else {
      setEndAt(Date.now() + (timeLeft === 0 ? total : timeLeft) * 1000);
      if (timeLeft === 0) setTimeLeft(total);
    }
  };
  const reset = () => {
    setEndAt(null);
    setTimeLeft(total);
  };

  const progress = total === 0 ? 0 : timeLeft / total;
  const done = timeLeft === 0;

  return (
    <BaseWidget title="Pomodoro" {...props}>
      <div className="pomo">
        <div className="pomo__modes" role="radiogroup" aria-label="Timer mode">
          {MODES.map((m) => (
            <button key={m.key} type="button" role="radio" aria-checked={modeKey === m.key} className="pomo__mode" onClick={() => choose(m.key)}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="pomo__dial">
          <svg viewBox="0 0 100 100" className="pomo__ring" aria-hidden>
            <circle className="pomo__track" cx="50" cy="50" r={RING_RADIUS} />
            <circle
              className="pomo__progress"
              cx="50"
              cy="50"
              r={RING_RADIUS}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - progress)}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="pomo__readout" role="timer" aria-live="off">
            <span className="pomo__time">{formatTime(timeLeft)}</span>
            <span className="pomo__hint">{done ? "Nicely done" : running ? "Stay with it" : "Ready when you are"}</span>
          </div>
        </div>

        <div className="pomo__controls">
          <button type="button" className="pomo__play" onClick={toggle} aria-label={running ? "Pause" : "Start"}>
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
