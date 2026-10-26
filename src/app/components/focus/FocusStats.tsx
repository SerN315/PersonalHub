"use client";
import { memo, useEffect, useState } from "react";
import BasicIcon from "../ultis/icons";
import { getFocusSummary, type FocusSummary } from "@/app/apis/focus";
import { tzOffsetMinutes, dayLabel } from "@/app/utils/todo/dates";
import { useFocusStore } from "@/app/utils/focus/engine";
import { useTodoStore } from "@/app/utils/todo/store";

const hours = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m` : `${minutes}m`);

// The pinned note of how it is going: today, the streak and the last two weeks, from your saved sessions.
function FocusStatsBase() {
  const today = useTodoStore((s) => s.today);
  const finished = useFocusStore((s) => s.finishedFocus);
  const status = useFocusStore((s) => s.status);
  const [data, setData] = useState<FocusSummary | null>(null);
  const [failed, setFailed] = useState(false);

  // Look again whenever a session ends (a moment later, so the save has landed).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      getFocusSummary(today, tzOffsetMinutes())
        .then((summary) => !cancelled && (setData(summary), setFailed(false)))
        .catch(() => !cancelled && setFailed(true));
    }, data ? 1500 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `data` only decides how long to wait, so it is left out on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, finished, status === "idle"]);

  const peak = Math.max(30, ...(data?.week.map((d) => d.minutes) ?? [0]));
  return (
    <section className="desk__card note" aria-labelledby="stats-title">
      <h3 id="stats-title"><BasicIcon icon="Fire02Icon" size={16} /> How it is going</h3>
      {failed && !data && <p className="note__fine">Could not load your numbers. They will appear once you are connected.</p>}
      {data && (
        <>
          <dl className="note__stats">
            <div><dt>Today</dt><dd>{data.today.sessions}<small> sessions</small></dd></div>
            <div><dt>Focused</dt><dd>{hours(data.today.minutes)}</dd></div>
            <div><dt>Streak</dt><dd>{data.streak}<small> day{data.streak === 1 ? "" : "s"}</small></dd></div>
          </dl>
          <svg className="note__chart" viewBox="0 0 140 44" role="img" aria-label={`Minutes focused in the last 14 days: ${data.week.map((d) => d.minutes).join(", ")}`}>
            {data.week.map((d, i) => {
              const h = d.minutes === 0 ? 2 : 4 + (d.minutes / peak) * 36;
              return <rect key={d.date} x={i * 10} y={42 - h} width="7" height={h} rx="1.5" className={d.date === today ? "is-today" : ""}><title>{`${dayLabel(d.date, today)}: ${d.minutes} min`}</title></rect>;
            })}
          </svg>
          <p className="note__fine">{data.total.sessions} finished sessions, {hours(data.total.minutes)} in all.</p>
        </>
      )}
    </section>
  );
}

export default memo(FocusStatsBase);
