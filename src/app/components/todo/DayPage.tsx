"use client";
import { memo, useEffect, useState } from "react";
import BasicIcon from "../ultis/icons";
import { getSummary, type Summary } from "@/app/apis/todo";
import { MONTHS_LONG, parts, tzOffsetMinutes, weekdayOf } from "@/app/utils/todo/dates";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Props {
  today: string;
  open: number;
  overdue: number;
  dueToday: number;
  doneCount: number; // changes whenever something is finished: the cue to refresh the streak
}

// The tear-off day page: today's date big, how the day is going, and a 14-day strip of what you got done.
function DayPage({ today, open, overdue, dueToday, doneCount }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      getSummary(today, tzOffsetMinutes()).then(setSummary).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [today, doneCount]);

  const { y, m, d } = parts(today);
  const week = summary?.week ?? [];
  const peak = Math.max(1, ...week.map((w) => w.count));
  return (
    <section className="day" aria-label="Today">
      <div className="day__tear" aria-hidden />
      <p className="day__month">{MONTHS_LONG[m - 1]} {y}</p>
      <p className="day__num">{d}</p>
      <p className="day__name">{DAYS[weekdayOf(today)]}</p>
      <dl className="day__stats">
        <div><dt>Due today</dt><dd>{dueToday}</dd></div>
        <div className={overdue ? "is-warn" : ""}><dt>Overdue</dt><dd>{overdue}</dd></div>
        <div><dt>Done today</dt><dd>{summary?.doneToday ?? 0}</dd></div>
      </dl>
      {summary && summary.streak > 0 && (
        <p className="day__streak"><BasicIcon icon="Fire02Icon" size={16} /> {summary.streak} day{summary.streak === 1 ? "" : "s"} in a row</p>
      )}
      {week.length > 0 && (
        <svg className="day__chart" viewBox="0 0 140 36" role="img" aria-label={`Tasks finished in the last 14 days: ${week.map((w) => w.count).join(", ")}`}>
          {week.map((w, i) => {
            const h = w.count === 0 ? 2 : 4 + (w.count / peak) * 28;
            return <rect key={w.date} x={i * 10} y={34 - h} width="7" height={h} rx="2" className={w.date === today ? "is-today" : ""} />;
          })}
        </svg>
      )}
      <p className="day__open">{open} open task{open === 1 ? "" : "s"} in all</p>
    </section>
  );
}

export default memo(DayPage);
