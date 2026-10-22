"use client";
import { memo, useEffect, useRef, useState } from "react";
import { useSkyStore, type Place } from "@/app/utils/weather/skyStore";
import { useEscape } from "../widgets/radio/useEscape";

const CITIES: Place[] = [
  { name: "Ho Chi Minh City", lat: 10.82, lon: 106.63 },
  { name: "Hanoi", lat: 21.03, lon: 105.85 },
  { name: "Da Nang", lat: 16.05, lon: 108.2 },
  { name: "Bangkok", lat: 13.76, lon: 100.5 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "Seoul", lat: 37.57, lon: 126.98 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "Cairo", lat: 30.04, lon: 31.24 },
  { name: "Cape Town", lat: -33.92, lon: 18.42 },
  { name: "Reykjavik", lat: 64.15, lon: -21.94 },
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Paris", lat: 48.86, lon: 2.35 },
  { name: "Berlin", lat: 52.52, lon: 13.4 },
  { name: "New York", lat: 40.71, lon: -74.01 },
  { name: "San Francisco", lat: 37.77, lon: -122.42 },
  { name: "Rio de Janeiro", lat: -22.91, lon: -43.17 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
];

// "10.8, 106.7" -> a place, or null when it is not a real latitude and longitude
const parseCoordinates = (text: string): Place | null => {
  const match = text.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon } : null;
};

// A desk globe on the counter. Click it to look at the sky somewhere else; the choice lasts for this browser tab only.
function LocationGlobe() {
  const place = useSkyStore((s) => s.place);
  const setPlace = useSkyStore((s) => s.setPlace);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  useEscape(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => !root.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const typed = parseCoordinates(query);
  const q = query.trim().toLowerCase();
  const shown = q ? CITIES.filter((c) => c.name.toLowerCase().includes(q)) : CITIES;
  const pick = (next: Place | null) => {
    setPlace(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="globe" ref={root}>
      <button type="button" className={`globe__button ${place ? "is-away" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog" aria-label={place ? `Showing the sky over ${place.name}. Change place` : "Look at the sky somewhere else"}>
        <svg viewBox="0 0 64 80" aria-hidden>
          <path className="globe__stand" d="M10 76 H54 M32 62 V76" />
          <path className="globe__arc" d="M12 56 C 4 38 10 14 32 8" />
          <circle className="globe__ball" cx="32" cy="34" r="24" />
          <path className="globe__line" d="M8 34 H56 M32 10 C 20 22 20 46 32 58 C 44 46 44 22 32 10 M14 20 H50 M14 48 H50" />
          <path className="globe__land" d="M20 24 C 26 20 30 26 26 30 C 22 34 16 30 20 24Z M36 36 C 42 32 48 38 44 44 C 40 48 34 42 36 36Z" />
        </svg>
        {place && <span className="globe__tag">{place.name}</span>}
      </button>

      {open && (
        <div className="globe__panel" role="dialog" aria-label="Choose a place">
          <p className="globe__note">Just for this tab. Your real location is untouched.</p>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a city, or type 10.8, 106.7" maxLength={40} aria-label="Search a city or type coordinates" onKeyDown={(e) => e.key === "Enter" && (typed ? pick(typed) : shown.length === 1 && pick(shown[0]))} />
          <ul>
            <li><button type="button" onClick={() => pick(null)} className={place ? "" : "is-on"}>My location</button></li>
            {typed && <li><button type="button" onClick={() => pick(typed)}>Go to {typed.name}</button></li>}
            {shown.map((city) => (
              <li key={city.name}><button type="button" onClick={() => pick(city)} className={place?.name === city.name ? "is-on" : ""}>{city.name}</button></li>
            ))}
            {!typed && shown.length === 0 && <li className="globe__none">No match. Try coordinates like 10.8, 106.7.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default memo(LocationGlobe);
