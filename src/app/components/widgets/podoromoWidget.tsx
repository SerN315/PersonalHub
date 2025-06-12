// components/widgets/PomodoroWidget.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import BaseWidget from "./BaseWidget";
import  WidgetProps  from "@/app/types/widget";
import "../../styles/widgets/pomodoro.scss";
import { formatTime } from "@/app/utils/commonUltis";
import BasicIcon from "../ultis/icons";

const DEFAULT_TIME = 25 * 60; // 25 minutes

export default function PomodoroWidget(props: WidgetProps) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    pause();
    setTimeLeft(DEFAULT_TIME);
  };

  return (
    <BaseWidget title="Pomodoro" {...props}>
      <div className="pomodoro-widget__container"
        onClick={() => {
          if (!isRunning) {
            start();
          }
          else{
            pause();
          }}}>
        <div className="pomodoro-widget__container__timer">
<div className="pomodoro-widget__container__timer__indicator">
  <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="hourglassClip">
        <path d="M5.19825 3.29918C5.80046 2 7.86697 2 12 2C16.133 2 18.1995 2 18.8017 3.29918C18.8535 3.41086 18.8972 3.52686 18.9323 3.6461C19.3414 5.0333 17.8802 6.64111 14.9577 9.85674L13 12L14.9577 14.1433C17.8802 17.3589 19.3414 18.9667 18.9323 20.3539C18.8972 20.4731 18.8535 20.5891 18.8017 20.7008C18.1995 22 16.133 22 12 22C7.86697 22 5.80046 22 5.19825 20.7008C5.14649 20.5891 5.10282 20.4731 5.06765 20.3539C4.65857 18.9667 6.11981 17.3589 9.0423 14.1433L11 12L9.0423 9.85674C6.11981 6.64111 4.65857 5.0333 5.06765 3.6461C5.10282 3.52686 5.14649 3.41086 5.19825 3.29918Z"/>
      </clipPath>
    </defs>



    {/* HOURGLASS OUTLINE */}
    <path
      d="M5.19825 3.29918C5.80046 2 7.86697 2 12 2C16.133 2 18.1995 2 18.8017 3.29918C18.8535 3.41086 18.8972 3.52686 18.9323 3.6461C19.3414 5.0333 17.8802 6.64111 14.9577 9.85674L13 12L14.9577 14.1433C17.8802 17.3589 19.3414 18.9667 18.9323 20.3539C18.8972 20.4731 18.8535 20.5891 18.8017 20.7008C18.1995 22 16.133 22 12 22C7.86697 22 5.80046 22 5.19825 20.7008C5.14649 20.5891 5.10282 20.4731 5.06765 20.3539C4.65857 18.9667 6.11981 17.3589 9.0423 14.1433L11 12L9.0423 9.85674C6.11981 6.64111 4.65857 5.0333 5.06765 3.6461C5.10282 3.52686 5.14649 3.41086 5.19825 3.29918Z"
      fill="#06301a"
      stroke="transparent"
      strokeWidth="0.1"
    />

        {/* FILLING SHAPE */}
<rect
  x="0"
  y={2 + (20 * (1 - timeLeft / DEFAULT_TIME))} // starts at y=2, moves down as time decreases
  width="24"
  height={20 * (timeLeft / DEFAULT_TIME)}       // max height = 20
  fill="#009650"
  clipPath="url(#hourglassClip)"
/>

  </svg>
</div>

          <span className="pomodoro-widget__container__timer__time">
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="pomodoro-widget__container__controls">
          {!isRunning ? (
            <button onClick={start} className="pomodoro-start">
              <BasicIcon icon="PlayIcon" color="currentColor" />
            </button>
          ) : (
            <button onClick={pause} className="pomodoro-pause">
              <BasicIcon icon="PauseIcon"  color="currentColor" />
            </button>
          )}
            <button onClick={reset} className="pomodoro-reset">
              <BasicIcon icon="RefreshIcon"  color="currentColor"/>
          </button>
        </div>
        

      </div>
    </BaseWidget>
  );
}
