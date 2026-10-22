"use client";
import { memo, useCallback, useRef, useState } from "react";
import BasicIcon from "../ultis/icons";
import { useSkyStore, type Sky } from "@/app/utils/weather/skyStore";
import { getWeatherIconName } from "@/app/utils/weatherMappings";
import type { IconName } from "../ultis/icons";

const CHANNELS = ["NOW", "HOURS", "DAYS"] as const;
const icon = (code?: number, isDay?: number) => getWeatherIconName(code, isDay) as IconName;
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const dayName = (date: string, i: number) => (i === 0 ? "TODAY" : WEEKDAY.format(new Date(`${date}T00:00:00Z`)).toUpperCase());
const hourLabel = (time: string) => `${String(new Date(time.replace(" ", "T")).getHours()).padStart(2, "0")}:00`;

// Where the parts are on the sprite (public/room/tv.png, 80 x 64 pixels): the glass, the dial and the three push buttons.
// Controls are real buttons laid over the drawn ones, so the picture stays the picture and the keyboard still works.
const SPRITE = { w: 80, h: 64 };
const place = (x0: number, y0: number, x1: number, y1: number) => ({
  left: `${(x0 / SPRITE.w) * 100}%`,
  top: `${(y0 / SPRITE.h) * 100}%`,
  width: `${((x1 - x0 + 1) / SPRITE.w) * 100}%`,
  height: `${((y1 - y0 + 1) / SPRITE.h) * 100}%`,
});
const GLASS = place(7, 21, 53, 51);
const DIAL = place(60, 22, 72, 34);
const BUTTONS = [place(61, 38, 71, 41), place(61, 43, 71, 46), place(61, 48, 71, 51)];

function Now({ sky }: { sky: Sky }) {
  return (
    <div className="tv__now">
      <p className="tv__place">{sky.location}</p>
      <div className="tv__big">
        <BasicIcon icon={icon(sky.code, sky.isDay)} size={40} strokeWidth={1.5} />
        <span>{sky.temperature}°</span>
      </div>
      <p className="tv__cond">{sky.condition}</p>
      <p className="tv__facts">
        {sky.high !== undefined && sky.low !== undefined && <span>H {sky.high}° L {sky.low}°</span>}
        {sky.feelsLike !== undefined && <span>FEELS {sky.feelsLike}°</span>}
        {sky.humidity !== undefined && <span>HUMID {sky.humidity}%</span>}
        {sky.windKph !== undefined && <span>WIND {sky.windKph} KM/H</span>}
      </p>
    </div>
  );
}

function Hours({ sky }: { sky: Sky }) {
  return (
    <ul className="tv__list" tabIndex={0} aria-label="Hour by hour">
      {sky.hours.map((hour) => (
        <li key={hour.time}>
          <span>{hourLabel(hour.time)}</span>
          <BasicIcon icon={icon(hour.condition?.code, hour.is_day)} size={20} strokeWidth={1.5} />
          <b>{Math.round(hour.temp_c)}°</b>
        </li>
      ))}
    </ul>
  );
}

function Days({ sky }: { sky: Sky }) {
  return (
    <ul className="tv__list" aria-label="The next days">
      {sky.days.map((day, i) => (
        <li key={day.date}>
          <span>{dayName(day.date, i)}</span>
          <BasicIcon icon={icon(day.code, 1)} size={20} strokeWidth={1.5} />
          <b>{day.low}-{day.high}°</b>
        </li>
      ))}
    </ul>
  );
}

// A pixel-art TV on the counter. The dial switches it on and off; the three push buttons pick the channel: the weather now,
// hour by hour, and the days ahead. Without a signal (no location, or the server is down) the screen shows static.
function WeatherTv() {
  const status = useSkyStore((s) => s.status);
  const sky = useSkyStore((s) => s.sky);
  const retry = useSkyStore((s) => s.retry);
  const [on, setOn] = useState(true);
  const [channel, setChannel] = useState(0);
  const [flicker, setFlicker] = useState(0); // bumping this replays the channel-change static

  const tune = useCallback((next: number) => {
    setOn(true);
    setChannel((current) => {
      if (current !== next) setFlicker((n) => n + 1);
      return next;
    });
  }, []);

  // A tap or click on the glass goes to the next channel; a swipe sideways goes forward or back. (The drawn buttons are small on a phone.)
  const press = useRef<{ x: number; y: number } | null>(null);
  const onGlassDown = (event: React.PointerEvent) => {
    press.current = { x: event.clientX, y: event.clientY };
  };
  const onGlassUp = (event: React.PointerEvent) => {
    const start = press.current;
    press.current = null;
    if (!start || !on) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const count = CHANNELS.length;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) tune((channel + (dx < 0 ? 1 : count - 1)) % count);
    else if (Math.hypot(dx, dy) < 8) tune((channel + 1) % count);
  };

  return (
    <div className={`tv ${on ? "is-on" : "is-off"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="tv__sprite" src="/room/tv.png" alt="" draggable={false} />

      <div className="tv__screen" style={GLASS} aria-live="polite" onPointerDown={onGlassDown} onPointerUp={onGlassUp}>
        {on && (
          <>
            <div className="tv__content" key={`${channel}-${flicker}`}>
              {!sky ? (
                <div className="tv__nosignal">
                  <b>NO SIGNAL</b>
                  <span>{status === "denied" ? "Allow location access to tune in." : status === "error" ? "The sky is out of reach right now." : "Tuning in..."}</span>
                  {(status === "error" || status === "denied") && <button type="button" onClick={retry}>TRY AGAIN</button>}
                </div>
              ) : channel === 0 ? (
                <Now sky={sky} />
              ) : channel === 1 ? (
                <Hours sky={sky} />
              ) : (
                <Days sky={sky} />
              )}
            </div>
            <span className="tv__osd" aria-hidden>CH {channel + 1}</span>
            <span className="tv__static" key={`s${flicker}`} aria-hidden />
          </>
        )}
        <span className="tv__glass" aria-hidden />
      </div>

      <button type="button" className={`tv__dial ${on ? "is-lit" : ""}`} style={DIAL} onClick={() => setOn(!on)} aria-pressed={on} aria-label={on ? "Turn the TV off" : "Turn the TV on"} />
      {BUTTONS.map((box, i) => (
        <button key={i} type="button" className={`tv__btn ${on && channel === i ? "is-lit" : ""}`} style={box} onClick={() => tune(i)} aria-pressed={on && channel === i} aria-label={`Channel ${i + 1}: ${CHANNELS[i].toLowerCase()}`} />
      ))}
    </div>
  );
}

export default memo(WeatherTv);
