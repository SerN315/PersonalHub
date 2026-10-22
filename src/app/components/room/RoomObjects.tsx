"use client";
import { memo, useEffect, useState } from "react";
import { preloadWidget } from "@/app/widgets/registry";
import { useRadioStore } from "@/app/utils/radio/engine";
import type { RoomProp } from "./roomProps";

// The things in the room that open a widget. Each is a real button holding its sprite (no text: the job is in the accessible
// name) plus, where it helps, a live detail drawn over the picture. Pointing at one (or tabbing to it) starts fetching its widget,
// so it opens at once when pressed.

interface Props {
  prop: RoomProp;
  onOpen: (prop: RoomProp) => void;
}

const warm = (prop: RoomProp) => () => preloadWidget(prop.widget);

// Re-reads the time every so often (and only the component using it re-renders).
function useNow(everyMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}

function Sprite({ prop, onOpen, className = "", children }: Props & { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={`prop ${className}`} onClick={() => onOpen(prop)} onPointerEnter={warm(prop)} onFocus={warm(prop)} aria-label={prop.label} aria-haspopup="dialog">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={prop.src} alt="" draggable={false} />
      {children}
    </button>
  );
}

// The face and pendulum are positioned from the sprite's own pixel grid (36 x 58): the face is centred at (17.5, 19.5) and the
// pendulum hangs from (17.5, 33).
function WallClockBase(props: Props) {
  const now = useNow(15_000);
  const minute = now.getMinutes() + now.getSeconds() / 60;
  const hour = (now.getHours() % 12) + minute / 60;
  const hand = (turns: number, length: number) => {
    const angle = turns * 2 * Math.PI;
    return { x2: 17.5 + Math.sin(angle) * length, y2: 19.5 - Math.cos(angle) * length };
  };
  const h = hand(hour / 12, 5);
  const m = hand(minute / 60, 7.6);
  return (
    <Sprite {...props} className="prop--clock">
      <svg className="clockHands" viewBox="0 0 36 58" aria-hidden shapeRendering="crispEdges">
        <line x1="17.5" y1="19.5" x2={h.x2} y2={h.y2} strokeWidth="1.6" />
        <line x1="17.5" y1="19.5" x2={m.x2} y2={m.y2} strokeWidth="1.1" />
        <circle cx="17.5" cy="19.5" r="1.2" className="clockHands__pin" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="clockPendulum" src="/room/pendulum.png" alt="" draggable={false} />
    </Sprite>
  );
}
export const WallClock = memo(WallClockBase);

// The page is a six-week grid starting on a Monday, drawn from (5, 23) in steps of (4, 3) on the 36 x 46 sprite.
function WallCalendarBase(props: Props) {
  const now = useNow(60_000);
  const offset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const index = offset + now.getDate() - 1;
  const row = Math.min(5, Math.floor(index / 7));
  const col = index % 7;
  return (
    <Sprite {...props}>
      <span
        className="calendarToday"
        style={{ left: `${((5 + col * 4 - 1) / 36) * 100}%`, top: `${((23 + row * 3 - 1) / 46) * 100}%`, width: `${(4 / 36) * 100}%`, height: `${(4 / 46) * 100}%` }}
        aria-hidden
      />
    </Sprite>
  );
}
export const WallCalendar = memo(WallCalendarBase);

export const StickyNote = memo(function StickyNote(props: Props) {
  return <Sprite {...props} />;
});

// A boombox on the counter: it bounces to the beat while the radio is playing.
function TableRadioBase(props: Props) {
  const playing = useRadioStore((s) => s.status === "playing");
  return <Sprite {...props} className={playing ? "is-playing" : ""} />;
}
export const TableRadio = memo(TableRadioBase);
