"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import BaseWidget from "./BaseWidget";
import BasicIcon from "@/app/components/ultis/icons";
import "../../styles/widgets/weather.scss";
import WidgetProps from "@/app/types/widget";
import { getWeatherBackground, getWeatherIconName } from "@/app/utils/weatherMappings";
import type * as Icons from "@hugeicons/core-free-icons";

interface Hour {
  time: string;
  temp_c: number;
  is_day?: number;
  condition?: { text?: string; code?: number };
}

interface Sky {
  location: string;
  temperature: number;
  condition: string;
  code?: number;
  isDay?: number;
  high?: number;
  low?: number;
  hours: Hour[];
}

type State = { kind: "loading" } | { kind: "denied" } | { kind: "error" } | { kind: "ready"; sky: Sky };

const HOURS_SHOWN = 12;
const icon = (code?: number, isDay?: number) => getWeatherIconName(code, isDay) as keyof typeof Icons;

// "2026-10-19 14:00" -> the next HOURS_SHOWN hours from now, carrying on into tomorrow.
function upcomingHours(days: { hour?: Hour[] }[] | undefined): Hour[] {
  const all = (days ?? []).flatMap((d) => d.hour ?? []);
  const now = Date.now() - 30 * 60 * 1000;
  const future = all.filter((h) => new Date(h.time.replace(" ", "T")).getTime() >= now);
  return (future.length ? future : all).slice(0, HOURS_SHOWN);
}

// The sky outside your window: the animated scene reflects the current condition, the details sit on top of it.
function WeatherWidget(props: WidgetProps) {
  const [state, setState] = useState<State>(() =>
    typeof navigator !== "undefined" && !navigator.geolocation ? { kind: "error" } : { kind: "loading" }
  );
  const [background, setBackground] = useState("");
  const previous = useRef({ condition: "", background: "" });

  useEffect(() => {
    let cancelled = false;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        // The weather key lives on the server; the browser only asks our own API.
        const query = `lat=${coords.latitude}&lon=${coords.longitude}`;
        try {
          const [now, forecast] = await Promise.all([fetch(`/api/weather/current?${query}`), fetch(`/api/weather/forecast?${query}&days=2`)]);
          if (!now.ok || !forecast.ok) throw new Error("Weather unavailable");
          const [current, ahead] = await Promise.all([now.json(), forecast.json()]);
          if (cancelled) return;

          const condition: string = current.current.condition.text;
          const nextBackground = getWeatherBackground(condition, previous.current.condition, previous.current.background);
          previous.current = { condition, background: nextBackground };
          setBackground(nextBackground);

          const today = ahead.forecast?.forecastday?.[0]?.day;
          setState({
            kind: "ready",
            sky: {
              location: current.location.name,
              temperature: Math.round(current.current.temp_c),
              condition,
              code: current.current.condition.code,
              isDay: current.current.is_day,
              high: today ? Math.round(today.maxtemp_c) : undefined,
              low: today ? Math.round(today.mintemp_c) : undefined,
              hours: upcomingHours(ahead.forecast?.forecastday),
            },
          });
        } catch {
          if (!cancelled) setState({ kind: "error" });
        }
      },
      () => !cancelled && setState({ kind: "denied" })
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Hourly strip: native scroll-snap, with arrows that page it.
  const stripRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const measureEdges = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const next = { start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    measureEdges();
    const observer = new ResizeObserver(measureEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [state, measureEdges]);
  const page = (direction: 1 | -1) => stripRef.current?.scrollBy({ left: direction * stripRef.current.clientWidth * 0.8, behavior: "smooth" });

  const sky = state.kind === "ready" ? state.sky : null;

  return (
    <BaseWidget title="Weather" {...props} tintable={false}>
      <div className="sky" style={background ? { backgroundImage: `url("${background}")` } : undefined}>
        <div className="sky__shade" />

        {state.kind === "loading" && <p className="sky__note">Looking outside…</p>}
        {state.kind === "denied" && <p className="sky__note">Allow location access to see the sky outside your window.</p>}
        {state.kind === "error" && <p className="sky__note">Can&apos;t see the sky right now. Try again in a bit.</p>}

        {sky && (
          <>
            <div className="sky__now">
              <div>
                <div className="sky__place">{sky.location}</div>
                <div className="sky__temp">{sky.temperature}°</div>
                <div className="sky__cond">
                  {sky.condition}
                  {sky.high !== undefined && sky.low !== undefined && (
                    <span className="sky__range">
                      {" "}
                      · H {sky.high}° L {sky.low}°
                    </span>
                  )}
                </div>
              </div>
              <BasicIcon icon={icon(sky.code, sky.isDay)} size={52} strokeWidth={1.4} className="sky__nowIcon" />
            </div>

            {sky.hours.length > 0 && (
              <div className="sky__hours">
                <button type="button" className="sky__arrow" onClick={() => page(-1)} disabled={edges.start} aria-label="Earlier hours">
                  <BasicIcon icon="ArrowLeft01Icon" size={16} />
                </button>
                <div className="sky__strip" ref={stripRef} onScroll={measureEdges}>
                  {sky.hours.map((hour) => (
                    <div className="sky__hour" key={hour.time}>
                      <span className="sky__hourTime">{new Date(hour.time.replace(" ", "T")).getHours()}:00</span>
                      <BasicIcon icon={icon(hour.condition?.code, hour.is_day)} size={26} strokeWidth={1.5} />
                      <span className="sky__hourTemp">{Math.round(hour.temp_c)}°</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="sky__arrow" onClick={() => page(1)} disabled={edges.end} aria-label="Later hours">
                  <BasicIcon icon="ArrowRight01Icon" size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </BaseWidget>
  );
}

export default memo(WeatherWidget);
