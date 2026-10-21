"use client";
import { memo } from "react";
import BasicIcon from "../ultis/icons";
import type { Task } from "@/app/apis/todo";
import { dayLabel, repeatLabel, timeLabel } from "@/app/utils/todo/dates";
import { dueState } from "@/app/utils/todo/views";

export interface RowHandlers {
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onMove?: (id: string, direction: -1 | 1) => void;
  onDragStart?: (id: string) => void;
  onDrop?: (id: string) => void;
}

interface Props extends RowHandlers {
  task: Task;
  today: string;
  subsDone: number;
  subsTotal: number;
  color: string | null; // the list's colour
  selected?: boolean;
  compact?: boolean; // the widget: no tags, no move buttons
}

const PRIORITY = ["", "Low priority", "Medium priority", "High priority"];

// One line on the page. A real checkbox (keyboard and screen reader friendly) drawn as a pen-ticked box; finishing a task
// ticks it in ink and presses a DONE stamp on it. It re-renders only when its own task (or the day) changes.
function TaskRow({ task, today, subsDone, subsTotal, color, selected, compact, onToggle, onOpen, onMove, onDragStart, onDrop }: Props) {
  const state = dueState(task, today);
  return (
    <li
      className={`row ${task.completed ? "is-done" : ""} ${selected ? "is-selected" : ""} row--p${task.priority}`}
      style={color ? ({ ["--list" as string]: color } as React.CSSProperties) : undefined}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => (e.dataTransfer.effectAllowed = "move", onDragStart(task.id)) : undefined}
      onDragOver={onDrop ? (e) => e.preventDefault() : undefined}
      onDrop={onDrop ? (e) => (e.preventDefault(), onDrop(task.id)) : undefined}
    >
      {task.priority > 0 && <span className="row__clip" role="img" aria-label={PRIORITY[task.priority]} />}
      <label className="row__check">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
        <span className="row__box" aria-hidden>
          <svg viewBox="0 0 24 24"><path d="M4 13.5c2.2 1.6 3.6 3.2 5 5.8C12 12 15.5 6.5 21 3.5" /></svg>
        </span>
        <span className="sr-only">Done: {task.text}</span>
      </label>

      <button type="button" className="row__body" onClick={() => onOpen(task.id)} aria-label={`Open ${task.text}`}>
        <span className="row__text">{task.text}</span>
        <span className="row__meta">
          {task.due_date && (
            <span className={`flag flag--${state}`}>
              {dayLabel(task.due_date, today)}
              {task.due_time && ` ${timeLabel(task.due_time)}`}
            </span>
          )}
          {task.repeat_unit && (
            <span className="row__repeat" title={repeatLabel(task.repeat_every, task.repeat_unit)}>
              <BasicIcon icon="RepeatIcon" size={13} />
              <span className="sr-only">{repeatLabel(task.repeat_every, task.repeat_unit)}</span>
            </span>
          )}
          {subsTotal > 0 && <span className="row__subs">{subsDone}/{subsTotal}</span>}
          {!compact && task.tags.map((tag) => <span key={tag} className="washi">{tag}</span>)}
        </span>
      </button>

      {!compact && onMove && (
        <span className="row__move">
          <button type="button" onClick={() => onMove(task.id, -1)} aria-label={`Move ${task.text} up`}><BasicIcon icon="ArrowDown01Icon" size={14} className="flip" /></button>
          <button type="button" onClick={() => onMove(task.id, 1)} aria-label={`Move ${task.text} down`}><BasicIcon icon="ArrowDown01Icon" size={14} /></button>
        </span>
      )}
      <span className="row__stamp" aria-hidden>DONE</span>
    </li>
  );
}

export default memo(TaskRow);
