"use client";
import { memo, useMemo, useState } from "react";
import BasicIcon from "../ultis/icons";
import { parseQuickAdd } from "@/app/utils/todo/quickAdd";
import { dayLabel, repeatLabel, timeLabel } from "@/app/utils/todo/dates";
import { useTodoStore } from "@/app/utils/todo/store";
import type { TodoList } from "@/app/apis/todo";

interface Props {
  listId: string | null; // the list a task goes to when the sentence doesn't name one
  dueDate?: string | null; // a date to give it when the sentence has none (the day page being looked at)
  lists: TodoList[];
  today: string;
  placeholder?: string;
  autoFocus?: boolean;
}

// One line to write a task the way you would say it: "pay rent friday 5pm !high #home every month".
// What it understood is shown as little chips before you press Enter, so nothing is a surprise.
function QuickAdd({ listId, dueDate = null, lists, today, placeholder = "Write a task... try “call mom tomorrow 5pm !high”", autoFocus }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const add = useTodoStore((s) => s.add);
  const parsed = useMemo(() => parseQuickAdd(value, { today, lists }), [value, today, lists]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed.text || busy) return;
    setBusy(true);
    const task = await add({
      text: parsed.text,
      list_id: parsed.listId ?? listId ?? undefined,
      due_date: parsed.due_date ?? dueDate,
      due_time: parsed.due_time,
      priority: parsed.priority,
      tags: parsed.tags,
      repeat: parsed.repeat,
    });
    setBusy(false);
    if (task) setValue("");
  };

  const chipText = (kind: string, label: string) => (kind === "date" ? dayLabel(label, today) : kind === "time" ? timeLabel(label) : label);

  return (
    <form className="qa" onSubmit={submit}>
      <label className="qa__field">
        <BasicIcon icon="PlusSignIcon" size={18} />
        <span className="sr-only">New task</span>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} maxLength={300} autoFocus={autoFocus} autoComplete="off" enterKeyHint="done" />
      </label>
      {parsed.chips.length > 0 && (
        <ul className="qa__chips" aria-label="What I understood">
          {parsed.chips.map((chip, i) => (
            <li key={i} className={`qa__chip qa__chip--${chip.kind}`}>
              {chip.kind === "repeat" ? repeatLabel(parsed.repeat?.every ?? 1, parsed.repeat?.unit ?? null) : chipText(chip.kind, chip.label)}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

export default memo(QuickAdd);
