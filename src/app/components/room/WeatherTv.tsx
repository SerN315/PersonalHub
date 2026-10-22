"use client";
import { memo, useCallback, useState } from "react";
import BasicIcon from "../ultis/icons";
import Knob from "../widgets/radio/Knob";
import { useSkyStore, type Sky } from "@/app/utils/weather/skyStore";
import { getWeatherIconName } from "@/app/utils/weatherMappings";
import type { IconName } from "../ultis/icons";

const CHANNELS = ["NOW", "HOURS", "DAYS"] as const;
const icon = (code?: number, isDay?: number) => getWeatherIconName(code, isDay) as IconName;
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const dayName = (date: string, i: number) => (i === 0 ? "TODAY" : WEEKDAY.format(new Date(`${date}T00:00:00Z`)).toUpperCase());
const hourLabel = (time: string) => `${String(new Date(time.replace(" ", "T")).getHours()).padStart(2, "0")}:00`;

function Now({ sky }: { sky: Sky }) {
  return (
    <div className="tv__now">
      <p className="tv__place">{sky.location}</p>
      <div className="tv__big">
        <BasicIcon icon={icon(sky.code, sky.isDay)} size={44} strokeWidth={1.5} />
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
          <BasicIcon icon={icon(hour.condition?.code, hour.is_day)} size={22} strokeWidth={1.5} />
          <b>{Math.round(hour.temp_c)}°</b>
        </li>
      ))}
    </ul>
  );
}

function Days({ sky }: { sky: Sky }) {
  return (
    <ul className="tv__list tv__list--days" aria-label="The next days">
      {sky.days.map((day, i) => (
        <li key={day.date}>
          <span>{dayName(day.date, i)}</span>
          <BasicIcon icon={icon(day.code, 1)} size={22} strokeWidth={1.5} />
          <b>{day.low}-{day.high}°</b>
        </li>
      ))}
    </ul>
  );
}

// A little tube TV on the counter: power button, a channel knob and CH buttons all work; the channels are the weather now,
// hour by hour, and the days ahead. Without a signal (no location, or the server is down) the screen shows static.
function WeatherTv() {
  const status = useSkyStore((s) => s.status);
  const sky = useSkyStore((s) => s.sky);
  const retry = useSkyStore((s) => s.retry);
  const [on, setOn] = useState(true);
  const [channel, setChannel] = useState(0);
  const [flicker, setFlicker] = useState(0); // bumping this replays the channel-change static

  const tune = useCallback((next: number) => {
    const clamped = Math.min(CHANNELS.length - 1, Math.max(0, next));
    setChannel((current) => {
      if (current !== clamped) setFlicker((n) => n + 1);
      return clamped;
    });
  }, []);
  const onKnob = useCallback((value: number) => tune(Math.round(value * (CHANNELS.length - 1))), [tune]);

  const noSignal = !sky;
  return (
    <div className={`tv ${on ? "is-on" : "is-off"}`}>
      <span className="tv__ears" aria-hidden><i /><i /></span>
      <div className="tv__cabinet">
        <div className="tv__screen" aria-live="polite">
          {on && (
            <>
              <div className="tv__content" key={`${channel}-${flicker}`}>
                {noSignal ? (
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
              <span className="tv__osd" aria-hidden>CH {channel + 1} · {CHANNELS[channel]}</span>
              <span className="tv__static" key={`s${flicker}`} aria-hidden />
            </>
          )}
          <span className="tv__glass" aria-hidden />
        </div>

        <div className="tv__panel">
          <div className="tv__channels" role="group" aria-label="Channel">
            <button type="button" onClick={() => tune(channel - 1)} disabled={!on || channel === 0} aria-label="Previous channel">CH−</button>
            <button type="button" onClick={() => tune(channel + 1)} disabled={!on || channel === CHANNELS.length - 1} aria-label="Next channel">CH+</button>
          </div>
          <Knob label="Channel" value={channel / (CHANNELS.length - 1)} onChange={onKnob} step={1 / (CHANNELS.length - 1)} valueText={CHANNELS[channel]} snaps={CHANNELS.length} />
          <button type="button" className="tv__power" onClick={() => setOn(!on)} aria-pressed={on} aria-label={on ? "Turn the TV off" : "Turn the TV on"}>
            <i aria-hidden />
          </button>
        </div>
      </div>
      <span className="tv__feet" aria-hidden />
    </div>
  );
}

export default memo(WeatherTv);
