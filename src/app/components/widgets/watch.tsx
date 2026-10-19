"use client";
import React, { memo, useEffect, useState } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/AnalogClock.scss";
import WidgetProps from "@/app/types/widget";
import { useEditMode } from "@/app/contexts/editWidgetContext";

const TICKS = Array.from({ length: 12 }, (_, i) => i);

// Ticks once a second, and only this component re-renders when it does. It stops while you arrange the dashboard.
function Clock() {
  const { editMode } = useEditMode();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (editMode) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [editMode]);

  const second = now.getSeconds();
  const minute = now.getMinutes() + second / 60;
  const hour = (now.getHours() % 12) + minute / 60;

  return (
    <div className="clock">
      <svg className="clock__face" viewBox="0 0 100 100" role="img" aria-label={now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}>
        <circle className="clock__rim" cx="50" cy="50" r="47" />
        {TICKS.map((i) => (
          <line key={i} className={i % 3 === 0 ? "clock__tick clock__tick--major" : "clock__tick"} x1="50" y1="8" x2="50" y2={i % 3 === 0 ? 15 : 12} transform={`rotate(${i * 30} 50 50)`} />
        ))}
        <line className="clock__hand clock__hand--hour" x1="50" y1="52" x2="50" y2="27" transform={`rotate(${hour * 30} 50 50)`} />
        <line className="clock__hand clock__hand--minute" x1="50" y1="54" x2="50" y2="17" transform={`rotate(${minute * 6} 50 50)`} />
        <line className="clock__hand clock__hand--second" x1="50" y1="58" x2="50" y2="14" transform={`rotate(${second * 6} 50 50)`} />
        <circle className="clock__pin" cx="50" cy="50" r="2.6" />
      </svg>
      <div className="clock__text">
        <span className="clock__time">{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
        <span className="clock__date">{now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

function WatchWidget(props: WidgetProps) {
  return (
    <BaseWidget title="Clock" {...props}>
      <Clock />
    </BaseWidget>
  );
}

export default memo(WatchWidget);
