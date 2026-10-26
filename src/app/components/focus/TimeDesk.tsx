"use client";
import { memo, useEffect, useState } from "react";
import BasicIcon from "../ultis/icons";
import { createLocalStore } from "@/app/utils/localStore";
import { MAX_CLOCKS, ZONES, cleanZones, differenceLabel, timeIn, type Zone } from "@/app/utils/focus/clocks";
import { formatClock } from "@/app/utils/focus/timer";
import { playChime } from "@/app/utils/focus/engine";

// The "time desk" beside the hourglass: world clocks, a stopwatch and a kitchen timer. Small things you reach for without a whole tab.

const clocks = createLocalStore<Zone[]>("personalhub:world-clocks", (raw) => cleanZones(Array.isArray(raw) ? raw.map((z) => (typeof z === "string" ? z : (z as Zone)?.tz)) : raw), []);

// re-reads the time every `ms` while something that needs it is on the screen
function useNow(ms: number, active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms, active]);
  return now;
}

function WorldClocksBase() {
  const zones = clocks.use();
  const now = useNow(1000);
  const date = new Date(now);
  const free = ZONES.filter((zone) => !zones.some((z) => z.tz === zone.tz));
  return (
    <section className="desk__card" aria-labelledby="clocks-title">
      <h3 id="clocks-title"><BasicIcon icon="ClockIcon" size={16} /> World clocks</h3>
      <ul className="worldClocks">
        {zones.length === 0 && <li className="worldClocks__empty">Add a city to keep an eye on the time there.</li>}
        {zones.map((zone) => {
          const t = timeIn(zone.tz, date);
          return (
            <li key={zone.tz}>
              <span className="worldClocks__sun" aria-hidden>{t.daytime ? "☀" : "☾"}</span>
              <span className="worldClocks__name">{zone.name}<small>{differenceLabel(zone.tz, date)}</small></span>
              <span className="worldClocks__time">{t.time}<small>{t.weekday}</small></span>
              <button type="button" className="desk__x" onClick={() => clocks.set(zones.filter((z) => z.tz !== zone.tz))} aria-label={`Remove ${zone.name}`}><BasicIcon icon="Cancel01Icon" size={14} /></button>
            </li>
          );
        })}
      </ul>
      {zones.length < MAX_CLOCKS && (
        <label className="desk__add">
          <span className="sr-only">Add a city</span>
          <select value="" onChange={(e) => { const zone = ZONES.find((z) => z.tz === e.target.value); if (zone) clocks.set([...zones, zone]); }}>
            <option value="">+ Add a city</option>
            {free.map((zone) => <option key={zone.tz} value={zone.tz}>{zone.name}</option>)}
          </select>
        </label>
      )}
    </section>
  );
}
export const WorldClocks = memo(WorldClocksBase);

function StopwatchBase() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [before, setBefore] = useState(0); // milliseconds counted before the last start
  const [laps, setLaps] = useState<number[]>([]);
  const running = startedAt !== null;
  const now = useNow(100, running);
  const elapsed = before + (startedAt === null ? 0 : now - startedAt);

  const show = (ms: number) => `${formatClock(Math.floor(ms / 1000))}.${String(Math.floor((ms % 1000) / 100))}`;
  return (
    <section className="desk__card" aria-labelledby="stopwatch-title">
      <h3 id="stopwatch-title"><BasicIcon icon="AlarmClockIcon" size={16} /> Stopwatch</h3>
      <p className="stopwatch__time" role="timer" aria-live="off">{show(elapsed)}</p>
      <div className="desk__row">
        <button type="button" className="desk__btn is-primary" onClick={() => (running ? (setBefore(elapsed), setStartedAt(null)) : setStartedAt(Date.now()))}>{running ? "Stop" : elapsed > 0 ? "Resume" : "Start"}</button>
        <button type="button" className="desk__btn" disabled={!running} onClick={() => setLaps([elapsed, ...laps].slice(0, 20))}>Lap</button>
        <button type="button" className="desk__btn" disabled={elapsed === 0} onClick={() => (setStartedAt(null), setBefore(0), setLaps([]))}>Reset</button>
      </div>
      {laps.length > 0 && (
        <ol className="stopwatch__laps" reversed>
          {laps.map((lap, i) => <li key={laps.length - i}>{show(lap)}</li>)}
        </ol>
      )}
    </section>
  );
}
export const Stopwatch = memo(StopwatchBase);

const PRESETS = [1, 3, 5, 10, 20];
const currentTime = () => Date.now(); // read when a button is pressed, never while drawing the screen

function KitchenTimerBase() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [custom, setCustom] = useState("");
  const [ringing, setRinging] = useState(false);
  const now = useNow(250, endsAt !== null);
  const left = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));

  // when it reaches zero: ring once and show it
  useEffect(() => {
    if (endsAt === null || left > 0) return;
    const done = setTimeout(() => {
      setEndsAt(null);
      setRinging(true);
      playChime();
    }, 0);
    return () => clearTimeout(done);
  }, [endsAt, left]);

  const begin = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600) return;
    setRinging(false);
    setTotal(minutes * 60);
    setEndsAt(currentTime() + minutes * 60_000);
  };

  return (
    <section className="desk__card" aria-labelledby="kitchen-title">
      <h3 id="kitchen-title"><BasicIcon icon="Coffee01Icon" size={16} /> Kitchen timer</h3>
      <p className={`kitchen__time ${ringing ? "is-ringing" : ""}`} role="timer" aria-live="off">{ringing ? "Ding!" : formatClock(endsAt === null ? 0 : left)}</p>
      {endsAt !== null && <span className="kitchen__bar" aria-hidden><i style={{ width: `${total ? (left / total) * 100 : 0}%` }} /></span>}
      <div className="desk__row">
        {PRESETS.map((m) => <button key={m} type="button" className="desk__btn" onClick={() => begin(m)}>{m} min</button>)}
      </div>
      <form className="desk__row" onSubmit={(e) => { e.preventDefault(); begin(Number(custom)); setCustom(""); }}>
        <label className="sr-only" htmlFor="kitchen-custom">Minutes</label>
        <input id="kitchen-custom" type="number" min={1} max={600} inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Minutes" />
        <button type="submit" className="desk__btn" disabled={!custom}>Set</button>
        {(endsAt !== null || ringing) && <button type="button" className="desk__btn" onClick={() => (setEndsAt(null), setRinging(false))}>Clear</button>}
      </form>
    </section>
  );
}
export const KitchenTimer = memo(KitchenTimerBase);
