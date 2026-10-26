"use client";
import { memo, useEffect, useState } from "react";
import BasicIcon from "../ultis/icons";
import { useRadioStore } from "@/app/utils/radio/engine";

const currentTime = () => Date.now();
const CHOICES = [15, 30, 60, 90];

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

// Like the dial on an old clock radio: pick a time and the radio switches itself off, so you can fall asleep to it.
function SleepTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const remaining = endsAt - currentTime();
      if (remaining <= 0) {
        useRadioStore.getState().pause();
        setEndsAt(null);
        return;
      }
      setLeft(remaining);
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const start = (minutes: number) => {
    setLeft(minutes * 60_000);
    setEndsAt(currentTime() + minutes * 60_000);
  };

  return (
    <section className="deskCard" aria-label="Sleep timer">
      <h2><BasicIcon icon="Moon02Icon" size={16} /> Sleep timer</h2>
      {endsAt === null ? (
        <div className="deskCard__row" role="group" aria-label="Switch the radio off in">
          {CHOICES.map((m) => <button key={m} type="button" className="chip" onClick={() => start(m)}>{m} min</button>)}
        </div>
      ) : (
        <div className="deskCard__row">
          <span className="deskCard__big" role="timer">{clock(left)}</span>
          <button type="button" className="chip" onClick={() => setEndsAt(null)}>Cancel</button>
        </div>
      )}
      <p className="deskCard__fine">Switches the station off. YouTube playlists keep their own player.</p>
    </section>
  );
}

export default memo(SleepTimer);
