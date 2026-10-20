"use client";
import React, { memo, useEffect, useRef } from "react";

interface KnobProps {
  label: string; // "Volume", "Tuning": announced by screen readers
  value: number; // 0..1
  onChange: (value: number) => void;
  step?: number; // how far one arrow key press or wheel notch turns it
  valueText?: string; // e.g. "70 percent" or "Chill FM"
  snaps?: number; // draw this many dots round the dial (tuning positions)
}

const SWEEP = 270; // a real knob turns about three quarters of a circle
const START = -135;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// A bakelite rotary knob. Turn it by dragging round it (not up and down), with the mouse wheel, or with the arrow keys.
function Knob({ label, value, onChange, step = 0.05, valueText, snaps }: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);

  const valueFromPointer = (event: React.PointerEvent) => {
    const rect = knobRef.current!.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < 4) return null; // right on the spindle: no direction
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI; // 0 = straight up, clockwise positive
    // The gap at the bottom is the knob's end stops: a pointer there pins it to the nearer end.
    return clamp((Math.min(Math.max(angle, START), -START) - START) / SWEEP);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = valueFromPointer(event);
    if (next !== null) onChange(next);
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = valueFromPointer(event);
    if (next !== null) onChange(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: step * 4, PageDown: -step * 4 };
    if (event.key in keys) {
      event.preventDefault();
      onChange(clamp(value + keys[event.key]));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(1);
    }
  };

  // React's onWheel is passive (it cannot stop the page scrolling), so this one is attached natively.
  const latest = useRef({ value, onChange, step });
  useEffect(() => {
    latest.current = { value, onChange, step };
  });
  useEffect(() => {
    const element = knobRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { value: current, onChange: change, step: size } = latest.current;
      change(clamp(current + (event.deltaY < 0 ? size : -size)));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const angle = START + clamp(value) * SWEEP;

  return (
    <div className="knob">
      {snaps && snaps > 1 && snaps <= 40 && (
        <span className="knob__dots" aria-hidden>
          {Array.from({ length: snaps }, (_, i) => {
            const a = START + (i / (snaps - 1)) * SWEEP;
            return <i key={i} style={{ transform: `rotate(${a}deg) translateY(calc(var(--knob-size) * -0.62))` }} />;
          })}
        </span>
      )}
      <div
        ref={knobRef}
        className="knob__cap"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamp(value) * 100)}
        aria-valuetext={valueText}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        style={{ ["--angle" as string]: `${angle}deg` }}
      >
        <span className="knob__grip" aria-hidden />
        <span className="knob__mark" aria-hidden />
      </div>
      <span className="knob__label" aria-hidden>
        {label}
      </span>
    </div>
  );
}

export default memo(Knob);
