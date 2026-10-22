"use client";
import { memo, useCallback, useSyncExternalStore } from "react";
import { useSkyStore } from "@/app/utils/weather/skyStore";

// Curtains for the window: lavender drapes pulled back with a gold tie, hung from a brass rod. They sway in a slow breeze (faster when
// the real wind outside is stronger). Press one to draw a sheer veil across the window and close the day out; press again to open
// them. Dust drifts in the light, and on a bright day the sun falls across the counter. The choice is remembered in this browser.

const KEY = "personalhub:room-curtains";
const EVENT = "personalhub:room-curtains-change";
let remembered: boolean | null = null; // the answer if the browser will not store it

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
};
const read = () => {
  if (remembered !== null) return remembered;
  try {
    return localStorage.getItem(KEY) === "drawn";
  } catch {
    return false;
  }
};
const write = (drawn: boolean) => {
  remembered = drawn;
  try {
    localStorage.setItem(KEY, drawn ? "drawn" : "open");
  } catch {
    /* private window: it lasts until the page is closed */
  }
  window.dispatchEvent(new Event(EVENT));
};

// where each speck of dust floats: x and y across the window (0..1), how long it takes, and when it starts
const MOTES = [
  { x: 0.18, y: 0.3, s: 9, d: 0 }, { x: 0.32, y: 0.62, s: 11, d: -4 }, { x: 0.46, y: 0.2, s: 10, d: -2 }, { x: 0.58, y: 0.5, s: 12, d: -7 },
  { x: 0.7, y: 0.28, s: 9.5, d: -5 }, { x: 0.8, y: 0.68, s: 13, d: -1 }, { x: 0.26, y: 0.8, s: 10.5, d: -8 }, { x: 0.64, y: 0.82, s: 11.5, d: -3 },
];

function WindowCurtainsBase() {
  const drawn = useSyncExternalStore(subscribe, read, () => false);
  const wind = useSkyStore((s) => s.sky?.windKph ?? 8);
  const daylight = useSkyStore((s) => s.sky?.isDay !== 0);
  const toggle = useCallback(() => write(!read()), []);

  const breeze = Math.min(2.4, Math.max(0.6, 0.6 + wind / 18)); // how far they sway
  const sway = Math.min(9, Math.max(4.5, 9 - wind / 6)); // how long a sway takes, in seconds
  const label = drawn ? "Open the curtains" : "Draw the curtains";
  const style = { ["--depth" as string]: 8, ["--breeze" as string]: breeze, ["--sway" as string]: `${sway}s` } as React.CSSProperties;

  return (
    <div className="room__layer room__curtains" style={style} data-drawn={drawn ? "true" : undefined}>
      {daylight && !drawn && <div className="sunbeam" aria-hidden />}
      <div className="motes" aria-hidden>
        {MOTES.map((m, i) => (
          <i key={i} style={{ ["--x" as string]: m.x, ["--y" as string]: m.y, ["--s" as string]: `${m.s}s`, ["--d" as string]: `${m.d}s` } as React.CSSProperties} />
        ))}
      </div>
      <div className="curtainVeil" aria-hidden />
      <div className="curtainRod" aria-hidden />
      <div className="curtain curtain--left">
        <button type="button" className="curtain__btn" onClick={toggle} aria-pressed={drawn} aria-label={label}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/room/curtain.png" alt="" draggable={false} />
        </button>
      </div>
      <div className="curtain curtain--right" aria-hidden>
        <button type="button" className="curtain__btn" onClick={toggle} tabIndex={-1} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/room/curtain.png" alt="" draggable={false} />
        </button>
      </div>
    </div>
  );
}

export default memo(WindowCurtainsBase);
