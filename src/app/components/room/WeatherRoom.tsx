"use client";
import { useEffect, useRef } from "react";
import WeatherTv from "./WeatherTv";
import LocationGlobe from "./LocationGlobe";
import { useSkyStore } from "@/app/utils/weather/skyStore";
import "@/app/styles/pages/weatherRoom.scss";

// The Weather tab: a window onto the sky with the TV on the counter beside it. The window is shut (a soft grey glass), the
// scene outside is the animated picture for the current condition. Layers sit at different depths and drift a little with the
// mouse, so the flat scene reads as a room. Moving the mouse only sets two CSS variables: nothing re-renders.
export default function WeatherRoom() {
  const load = useSkyStore((s) => s.load);
  const background = useSkyStore((s) => s.background);
  const sky = useSkyStore((s) => s.sky);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      set(((event.clientX - rect.left) / rect.width - 0.5) * 2, ((event.clientY - rect.top) / rect.height - 0.5) * 2);
    };
    const leave = () => set(0, 0);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const night = sky?.isDay === 0;
  return (
    <div className="weatherRoom">
      <h1 className="sr-only">Weather</h1>
      <div className="room" ref={stage} data-night={night ? "true" : undefined} role="group" aria-label={sky ? `A window onto the sky: ${sky.condition}, ${sky.temperature} degrees in ${sky.location}` : "A window onto the sky"}>
        <div className="scene">
        <div className="room__layer room__wall" style={{ ["--depth" as string]: 3 }} aria-hidden />

        <div className="room__layer room__counter" style={{ ["--depth" as string]: 10 }} aria-hidden>
          <div className="counter__top" />
          <div className="counter__front" />
        </div>

        <div className="room__layer room__window" style={{ ["--depth" as string]: 6 }}>
          <div className="window">
            <div className="window__outside" style={{ ["--shift" as string]: -1.5, backgroundImage: background ? `url("${background}")` : undefined }} aria-hidden />
            <div className="window__glass" aria-hidden />
            <div className="window__bars" aria-hidden><i /><i /></div>
            <span className="window__latch" aria-hidden />
          </div>
          <div className="window__sill" aria-hidden />
        </div>

        <div className="room__layer room__plant" style={{ ["--depth" as string]: 13 }} aria-hidden>
          <svg viewBox="0 0 80 110">
            <g className="plant__leaves">
              <path d="M40 70 C 22 60 14 40 22 20 C 36 28 42 48 40 70Z" />
              <path d="M40 70 C 58 62 68 42 60 18 C 46 28 38 48 40 70Z" />
              <path d="M40 72 C 36 52 38 30 40 8 C 48 28 48 52 40 72Z" />
            </g>
            <path className="plant__pot" d="M18 70 H62 L56 104 H24Z" />
            <rect className="plant__rim" x="14" y="64" width="52" height="10" rx="4" />
          </svg>
        </div>

        <div className="room__layer room__globe" style={{ ["--depth" as string]: 14 }}>
          <LocationGlobe />
        </div>

        <div className="room__layer room__tv" style={{ ["--depth" as string]: 16 }}>
          <WeatherTv />
        </div>
        </div>
      </div>
    </div>
  );
}
