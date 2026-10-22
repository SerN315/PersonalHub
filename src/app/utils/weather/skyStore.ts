import { create } from "zustand";
import { getWeatherBackground } from "@/app/utils/weatherMappings";

// The sky outside, fetched once and shared: the Weather widget, the Weather tab's window and its TV all read this, so the
// browser asks for your location (and the server for the forecast) once, not once per place that shows it.

export interface Hour {
  time: string;
  temp_c: number;
  is_day?: number;
  condition?: { text?: string; code?: number };
}

export interface Day {
  date: string; // "2026-10-22"
  high: number;
  low: number;
  condition: string;
  code?: number;
  rainChance?: number; // percent
}

export interface Sky {
  location: string;
  temperature: number;
  feelsLike?: number;
  humidity?: number;
  windKph?: number;
  condition: string;
  code?: number;
  isDay?: number;
  high?: number;
  low?: number;
  hours: Hour[];
  days: Day[];
}

export type SkyStatus = "idle" | "loading" | "denied" | "error" | "ready";

interface SkyState {
  status: SkyStatus;
  sky: Sky | null;
  background: string; // the animated scene for the current condition
  load: () => void;
  retry: () => void;
}

const HOURS_SHOWN = 12;
const REFRESH_MS = 30 * 60 * 1000;
let started = false;
let timer: ReturnType<typeof setInterval> | undefined;

// "2026-10-19 14:00" -> the next HOURS_SHOWN hours from now, carrying on into tomorrow.
function upcomingHours(days: { hour?: Hour[] }[] | undefined): Hour[] {
  const all = (days ?? []).flatMap((d) => d.hour ?? []);
  const now = Date.now() - 30 * 60 * 1000;
  const future = all.filter((h) => new Date(h.time.replace(" ", "T")).getTime() >= now);
  return (future.length ? future : all).slice(0, HOURS_SHOWN);
}

export const useSkyStore = create<SkyState>((set, get) => {
  let previous = { condition: "", background: "" };

  const fetchSky = (coords: { latitude: number; longitude: number }, quiet: boolean) => {
    // The weather key lives on the server; the browser only asks our own API.
    const query = `lat=${coords.latitude}&lon=${coords.longitude}`;
    return Promise.all([fetch(`/api/weather/current?${query}`), fetch(`/api/weather/forecast?${query}&days=3`)])
      .then(async ([now, forecast]) => {
        if (!now.ok || !forecast.ok) throw new Error("Weather unavailable");
        const [current, ahead] = await Promise.all([now.json(), forecast.json()]);
        const condition: string = current.current.condition.text;
        const background = getWeatherBackground(condition, previous.condition, previous.background);
        previous = { condition, background };

        type ForecastDay = { date?: string; day?: Record<string, unknown> & { condition?: { text?: string; code?: number } }; hour?: Hour[] };
        const forecastDays: ForecastDay[] = ahead.forecast?.forecastday ?? [];
        const today = forecastDays[0]?.day;
        set({
          status: "ready",
          background,
          sky: {
            location: current.location.name,
            temperature: Math.round(current.current.temp_c),
            feelsLike: current.current.feelslike_c === undefined ? undefined : Math.round(current.current.feelslike_c),
            humidity: current.current.humidity,
            windKph: current.current.wind_kph === undefined ? undefined : Math.round(current.current.wind_kph),
            condition,
            code: current.current.condition.code,
            isDay: current.current.is_day,
            high: today ? Math.round(today.maxtemp_c as number) : undefined,
            low: today ? Math.round(today.mintemp_c as number) : undefined,
            hours: upcomingHours(forecastDays),
            days: forecastDays.flatMap((d) =>
              d.date && d.day && typeof d.day.maxtemp_c === "number" && typeof d.day.mintemp_c === "number"
                ? [{ date: d.date, high: Math.round(d.day.maxtemp_c), low: Math.round(d.day.mintemp_c), condition: d.day.condition?.text ?? "", code: d.day.condition?.code, rainChance: d.day.daily_chance_of_rain as number | undefined }]
                : [],
            ),
          },
        });
      })
      .catch(() => {
        if (!quiet || get().status !== "ready") set({ status: "error" }); // a failed background refresh keeps showing the last sky
      });
  };

  const locate = (quiet: boolean) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return set({ status: "error" });
    if (!quiet) set({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void fetchSky(coords, quiet),
      () => !quiet && set({ status: "denied" }),
    );
  };

  return {
    status: "idle",
    sky: null,
    background: "",
    load: () => {
      if (started) return;
      started = true;
      locate(false);
      timer = setInterval(() => document.visibilityState === "visible" && locate(true), REFRESH_MS);
    },
    retry: () => {
      clearInterval(timer);
      started = false;
      get().load();
    },
  };
});
