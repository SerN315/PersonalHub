"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BasicIcon from "../ultis/icons";
import type { Priority, RepeatUnit, Task, TodoList } from "@/app/apis/todo";
import { useTodoStore } from "@/app/utils/todo/store";
import { useEscape } from "../widgets/radio/useEscape";

const UNITS: { value: RepeatUnit; label: string }[] = [
  { value: "day", label: "day(s)" },
  { value: "weekday", label: "weekday" },
  { value: "week", label: "week(s)" },
  { value: "month", label: "month(s)" },
  { value: "year", label: "year(s)" },
];
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 0, label: "None" },
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];

interface Props {
  task: Task;
  subtasks: Task[];
  lists: TodoList[];
  onClose: () => void;
}

const parseTags = (s: string) => [...new Set(s.split(/[,\s]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean))].slice(0, 8);

// The index card for one task: everything about it on a single card you fill in and file back. Edits are a draft and are
// filed (saved) when you press Save or close the card, so one edit is one request, not one per keystroke.
export default function TaskCard({ task, subtasks, lists, onClose }: Props) {
  const patch = useTodoStore((s) => s.patch);
  const remove = useTodoStore((s) => s.remove);
  const add = useTodoStore((s) => s.add);
  const toggle = useTodoStore((s) => s.toggle);
  const today = useTodoStore((s) => s.today);

  const [text, setText] = useState(task.text);
  const [notes, setNotes] = useState(task.notes);
  const [date, setDate] = useState(task.due_date ?? "");
  const [time, setTime] = useState(task.due_time ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [tags, setTags] = useState(task.tags.join(", "));
  const [listId, setListId] = useState(task.list_id);
  const [every, setEvery] = useState(task.repeat_every ?? 1);
  const [unit, setUnit] = useState<RepeatUnit | "">(task.repeat_unit ?? "");
  const [newSub, setNewSub] = useState("");
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    first.current?.focus();
    return () => back?.focus?.();
  }, []);

  const changes = useMemo(() => {
    const out: Record<string, unknown> = {};
    const t = text.trim();
    if (t && t !== task.text) out.text = t;
    if (notes !== task.notes) out.notes = notes;
    if ((date || null) !== task.due_date) out.due_date = date || null;
    if ((time || null) !== task.due_time) out.due_time = time || null;
    if (priority !== task.priority) out.priority = priority;
    const tg = parseTags(tags);
    if (tg.join("\n") !== task.tags.join("\n")) out.tags = tg;
    if (listId !== task.list_id) out.list_id = listId;
    const repeatNow = unit ? { every: unit === "weekday" ? 1 : every, unit } : null;
    const repeatWas = task.repeat_unit ? { every: task.repeat_every, unit: task.repeat_unit } : null;
    if (JSON.stringify(repeatNow) !== JSON.stringify(repeatWas) || ("due_date" in out && repeatNow)) out.repeat = repeatNow;
    return out;
  }, [text, notes, date, time, priority, tags, listId, every, unit, task]);

  const needsDate = unit !== "" && !date;
  const close = () => {
    if (needsDate) return;
    if (Object.keys(changes).length) patch(task.id, changes);
    onClose();
  };
  useEscape(close);

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setNewSub("");
    void add({ text: t, parent_id: task.id, list_id: task.list_id });
  };

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form className="card" role="dialog" aria-modal="true" aria-label="Edit task" onSubmit={(e) => (e.preventDefault(), close())}>
        <header className="card__head">
          <input ref={first} className="card__title" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} aria-label="Task" />
          <button type="button" className="card__x" onClick={close} aria-label="Save and close">
            <BasicIcon icon="Cancel01Icon" size={18} />
          </button>
        </header>

        <div className="card__grid">
          <label>Due<input type="date" value={date} onChange={(e) => setDate(e.target.value)} min="2000-01-01" max="2100-12-31" /></label>
          <label>Time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!date} /></label>
          <label>List
            <select value={listId} onChange={(e) => setListId(e.target.value)}>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label>Tags<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="home, money" /></label>
        </div>

        <fieldset className="card__clips">
          <legend>Priority</legend>
          {PRIORITIES.map((p) => (
            <label key={p.value} className={`clipOption clipOption--${p.value}`}>
              <input type="radio" name="priority" checked={priority === p.value} onChange={() => setPriority(p.value)} />
              <span>{p.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="card__repeat">
          <label>Repeat
            <select value={unit} onChange={(e) => setUnit(e.target.value as RepeatUnit | "")}>
              <option value="">Never</option>
              {UNITS.map((u) => <option key={u.value} value={u.value}>{u.value === "weekday" ? "Every weekday" : `Every ${u.label}`}</option>)}
            </select>
          </label>
          {unit && unit !== "weekday" && (
            <label>Every<input type="number" min={1} max={365} value={every} onChange={(e) => setEvery(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} /></label>
          )}
          {needsDate && <p className="card__hint" role="alert">A repeating task needs a due date.</p>}
        </div>

        <label className="card__notes">Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={4000} placeholder="Anything worth remembering" />
        </label>

        {task.parent_id === null && (
          <div className="card__subs">
            <h4>Steps</h4>
            <ul>
              {subtasks.map((s) => (
                <li key={s.id} className={s.completed ? "is-done" : ""}>
                  <label><input type="checkbox" checked={s.completed} onChange={() => toggle(s.id)} /> <span>{s.text}</span></label>
                  <button type="button" onClick={() => remove(s.id)} aria-label={`Remove step ${s.text}`}><BasicIcon icon="Cancel01Icon" size={14} /></button>
                </li>
              ))}
            </ul>
            <div className="card__addSub">
              <input value={newSub} onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())} placeholder="Add a step" maxLength={300} aria-label="New step" />
              <button type="button" onClick={addSub} aria-label="Add step"><BasicIcon icon="PlusSignIcon" size={16} /></button>
            </div>
          </div>
        )}

        <footer className="card__foot">
          <button type="button" className="card__delete" onClick={() => (remove(task.id), onClose())}><BasicIcon icon="Delete02Icon" size={16} /> Delete</button>
          <button type="button" className="card__today" onClick={() => setDate(today)}>Due today</button>
          <button type="submit" className="card__save">Save</button>
        </footer>
      </form>
    </div>
  );
}
