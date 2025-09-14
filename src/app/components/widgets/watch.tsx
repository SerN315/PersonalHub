import React, { useEffect, useState } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/AnalogClock.scss";
import WidgetProps from "@/app/types/widget";

const AnalogClock: React.FC<{ paused?: boolean }> = ({ paused }) => {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (paused) return;

    // Initialize time immediately on client mount
    setTime(new Date());

    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [paused, mounted]);

  if (!mounted || time === null) {
    // Render fallback/empty or loading on server and before mount
    return <div className="clock-container">Loading...</div>;
  }

  const hour = (time.getHours() % 12) + time.getMinutes() / 60;
  const minute = time.getMinutes() + time.getSeconds() / 60;
  const second = time.getSeconds();

  return (
    <div className="clock-container">
      <div className="clock-wrapper">
        <div className="clock-base">
          <div className="clock-dial">
            {Array.from({ length: 12 }).map((_, i) => (
              <div className="clock-indicator" key={i} />
            ))}
          </div>
          <div
            className="clock-hour"
            style={{ transform: `rotate(${hour * 30}deg)` }}
          />
          <div
            className="clock-minute"
            style={{ transform: `rotate(${minute * 6}deg)` }}
          />
          <div
            className="clock-second"
            style={{ transform: `rotate(${second * 6}deg)` }}
          />
          <div className="clock-center" />
        </div>
      </div>
    </div>
  );
};

export default function WatchWidget(props: WidgetProps & { paused?: boolean }) {
  return (
    <BaseWidget title="Analog Clock" {...props}>
      <AnalogClock paused={props.paused} />
    </BaseWidget>
  );
}
