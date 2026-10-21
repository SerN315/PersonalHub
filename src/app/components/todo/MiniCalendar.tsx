"use client";
import { memo, useState } from "react";
import BasicIcon from "../ultis/icons";
import { MONTHS_LONG, addMonths, fromParts, monthGrid, parts } from "@/app/utils/todo/dates";

interface Props {
  today: string;
  selected: string | null;
  dots: Map<string, number>;
  onPick: (iso: string) => void;
}

const HEAD = ["M", "T", "W", "T", "F", "S", "S"];

// The month page of the planner: a dot under each day that has something due; pick a day to see just that day.
function MiniCalendar({ today, selected, dots, onPick }: Props) {
  const [anchor, setAnchor] = useState(() => {
    const { y, m } = parts(selected ?? today);
    return fromParts(y, m, 1);
  });
  const { y, m } = parts(anchor);
  const grid = monthGrid(y, m, 1);
  return (
    <section className="cal" aria-label="Month">
      <header>
        <button type="button" onClick={() => setAnchor(addMonths(anchor, -1))} aria-label="Previous month"><BasicIcon icon="ArrowLeft01Icon" size={16} /></button>
        <h3>{MONTHS_LONG[m - 1]} {y}</h3>
        <button type="button" onClick={() => setAnchor(addMonths(anchor, 1))} aria-label="Next month"><BasicIcon icon="ArrowRight01Icon" size={16} /></button>
      </header>
      <div className="cal__grid">
        {HEAD.map((h, i) => <span key={i} className="cal__dow" aria-hidden>{h}</span>)}
        {grid.map(({ iso, inMonth }) => {
          const n = dots.get(iso) ?? 0;
          return (
            <button
              key={iso}
              type="button"
              className={`cal__day ${inMonth ? "" : "is-out"} ${iso === today ? "is-today" : ""} ${iso === selected ? "is-selected" : ""}`}
              onClick={() => onPick(iso)}
              aria-label={`${iso}${n ? `, ${n} due` : ""}`}
              aria-pressed={iso === selected}
            >
              {parts(iso).d}
              {n > 0 && <i className={n > 2 ? "dot dot--many" : "dot"} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(MiniCalendar);
