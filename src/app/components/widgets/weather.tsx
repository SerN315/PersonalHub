"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useSkyStore } from "@/app/utils/weather/skyStore";
import BaseWidget from "./BaseWidget";
import BasicIcon from "@/app/components/ultis/icons";
import "../../styles/widgets/weather.scss";
import WidgetProps from "@/app/types/widget";
import { getWeatherIconName } from "@/app/utils/weatherMappings";
import type { IconName } from "@/app/components/ultis/icons";

const icon = (code?: number, isDay?: number) => getWeatherIconName(code, isDay) as IconName;

// The sky outside your window: the animated scene reflects the current condition, the details sit on top of it.
function WeatherWidget(props: WidgetProps) {
  const status = useSkyStore((s) => s.status);
  const sky = useSkyStore((s) => s.sky);
  const background = useSkyStore((s) => s.background);
  const load = useSkyStore((s) => s.load);
  const state = status === "ready" && sky ? { kind: "ready" as const, sky } : { kind: status === "denied" ? ("denied" as const) : status === "error" ? ("error" as const) : ("loading" as const) };

  useEffect(() => {
    load();
  }, [load]);

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
  }, [sky, measureEdges]);
  const page = (direction: 1 | -1) => stripRef.current?.scrollBy({ left: direction * stripRef.current.clientWidth * 0.8, behavior: "smooth" });

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
