"use client";
import { useState } from "react";
import BasicIcon from "../ultis/icons";
import { PlacePanel } from "./LocationGlobe";
import { PROPS, type RoomProp } from "./roomProps";
import { useSkyStore, type Sky } from "@/app/utils/weather/skyStore";
import { getWeatherIconName } from "@/app/utils/weatherMappings";
import { preloadWidget } from "@/app/widgets/registry";
import type { IconName } from "../ultis/icons";
import "@/app/styles/pages/weatherMobile.scss";

const TABS = ["Now", "Hours", "Days"] as const;
type Tab = (typeof TABS)[number];
const icon = (code?: number, isDay?: number) => getWeatherIconName(code, isDay) as IconName;
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const dayName = (date: string, i: number) => (i === 0 ? "Today" : WEEKDAY.format(new Date(`${date}T00:00:00Z`)));
const hourLabel = (time: string) => `${String(new Date(time.replace(" ", "T")).getHours()).padStart(2, "0")}:00`;

function Facts({ sky }: { sky: Sky }) {
  const rows: [string, string][] = [
    ["Feels like", sky.feelsLike === undefined ? "" : `${sky.feelsLike}°`],
    ["High / Low", sky.high === undefined || sky.low === undefined ? "" : `${sky.high}° / ${sky.low}°`],
    ["Humidity", sky.humidity === undefined ? "" : `${sky.humidity}%`],
    ["Wind", sky.windKph === undefined ? "" : `${sky.windKph} km/h`],
  ];
  return (
    <dl className="wxm__facts">
      {rows.filter(([, value]) => value).map(([name, value]) => (
        <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}

// The phone layout of the Weather tab: no room, just the sky in a frame, the forecast under it, and the same little objects
// (clock, calendar, note, globe) as a row of buttons within thumb's reach. Plain, quick and calm.
export default function MobileWeather({ onOpen }: { onOpen: (prop: RoomProp) => void }) {
  const status = useSkyStore((s) => s.status);
  const sky = useSkyStore((s) => s.sky);
  const background = useSkyStore((s) => s.background);
  const place = useSkyStore((s) => s.place);
  const setPlace = useSkyStore((s) => s.setPlace);
  const retry = useSkyStore((s) => s.retry);
  const [tab, setTab] = useState<Tab>("Now");
  const [picking, setPicking] = useState(false);

  return (
    <div className="wxm" data-night={sky?.isDay === 0 ? "true" : undefined}>
      <section className="wxm__sky" style={background ? { backgroundImage: `url("${background}")` } : undefined} aria-label={sky ? `${sky.condition}, ${sky.temperature} degrees in ${sky.location}` : "The sky"}>
        <div className="wxm__shade" aria-hidden />
        {sky ? (
          <div className="wxm__now">
            <p className="wxm__place">{sky.location}</p>
            <p className="wxm__temp"><BasicIcon icon={icon(sky.code, sky.isDay)} size={44} strokeWidth={1.5} /> {sky.temperature}°</p>
            <p className="wxm__cond">{sky.condition}</p>
          </div>
        ) : (
          <div className="wxm__note">
            <p>{status === "denied" ? "Allow location access to see the sky." : status === "error" ? "Can't see the sky right now." : "Looking outside..."}</p>
            {(status === "denied" || status === "error") && <button type="button" onClick={retry}>Try again</button>}
          </div>
        )}
      </section>

      <div className="wxm__tabs" role="tablist" aria-label="Forecast">
        {TABS.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? "is-on" : ""} onClick={() => setTab(name)}>{name}</button>
        ))}
      </div>

      <section className="wxm__panel" role="tabpanel" aria-label={tab}>
        {!sky ? null : tab === "Now" ? (
          <Facts sky={sky} />
        ) : tab === "Hours" ? (
          <ul className="wxm__hours">
            {sky.hours.map((hour) => (
              <li key={hour.time}>
                <span>{hourLabel(hour.time)}</span>
                <BasicIcon icon={icon(hour.condition?.code, hour.is_day)} size={26} strokeWidth={1.5} />
                <b>{Math.round(hour.temp_c)}°</b>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="wxm__days">
            {sky.days.map((day, i) => (
              <li key={day.date}>
                <span>{dayName(day.date, i)}</span>
                <BasicIcon icon={icon(day.code, 1)} size={26} strokeWidth={1.5} />
                <b>{day.low}° / {day.high}°</b>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="wxm__props" aria-label="Your things">
        {PROPS.map((prop) => (
          <button key={prop.widget} type="button" onClick={() => onOpen(prop)} onPointerDown={() => preloadWidget(prop.widget)} aria-label={prop.label} aria-haspopup="dialog">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={prop.src} alt="" draggable={false} />
          </button>
        ))}
        <button type="button" className={place ? "is-away" : ""} onClick={() => setPicking(true)} aria-haspopup="dialog" aria-label={place ? `Showing the sky over ${place.name}. Change place` : "Look at the sky somewhere else"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/room/globe.png" alt="" draggable={false} />
        </button>
      </nav>

      {picking && (
        <div className="wxm__sheetScrim" onPointerDown={(event) => event.target === event.currentTarget && setPicking(false)}>
          <PlacePanel className="wxm__sheet globe__panel" onPick={(next) => (setPlace(next), setPicking(false))} onClose={() => setPicking(false)} />
        </div>
      )}
    </div>
  );
}
