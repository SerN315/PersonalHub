"use client";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BaseWidget from "./BaseWidget";
import QuickAdd from "../todo/QuickAdd";
import TaskRow from "../todo/TaskRow";
import TaskCard from "../todo/TaskCard";
import BasicIcon from "../ultis/icons";
import WidgetProps from "@/app/types/widget";
import { useTodoStore } from "@/app/utils/todo/store";
import { selectTasks, subtasksByParent, NO_FILTERS, type Scope } from "@/app/utils/todo/views";
import "../../styles/pages/planner.scss";
import "../../styles/widgets/todolist.scss";

// The desk-top glance at the planner: a small spiral notepad of what is due today (or one list). The same live copy of the
// tasks as the Planner page, so ticking here ticks there. Which page it shows is remembered in the widget's own data.
const toScope = (view: unknown): Scope => {
  if (view === "all") return { kind: "all" };
  if (typeof view === "string" && view.startsWith("list:")) return { kind: "list", id: view.slice(5) };
  return { kind: "today" };
};

function TodoListWidget(props: WidgetProps) {
  const { id, data, onData } = props;
  const status = useTodoStore((s) => s.status);
  const tasks = useTodoStore((s) => s.tasks);
  const lists = useTodoStore((s) => s.lists);
  const today = useTodoStore((s) => s.today);
  const load = useTodoStore((s) => s.load);
  const toggle = useTodoStore((s) => s.toggle);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const view = typeof data?.view === "string" ? data.view : "today";
  const listExists = !view.startsWith("list:") || lists.some((l) => l.id === view.slice(5));
  const effective: Scope = useMemo(() => (listExists ? toScope(view) : { kind: "today" }), [view, listExists]);

  const shown = useMemo(() => selectTasks(tasks, effective, NO_FILTERS, today), [tasks, effective, today]);
  const subs = useMemo(() => subtasksByParent(tasks), [tasks]);
  const colorOf = useMemo(() => new Map(lists.map((l) => [l.id, l.color])), [lists]);
  const onOpen = useCallback((taskId: string) => setOpenId(taskId), []);
  const closeCard = useCallback(() => setOpenId(null), []);
  const openTask = openId ? tasks.find((t) => t.id === openId) : undefined;
  const target = effective.kind === "list" ? effective.id : lists[0]?.id ?? null;

  return (
    <BaseWidget title="To-do" {...props}>
      <div className="notepad">
        <div className="notepad__rings" aria-hidden>{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
        <header className="notepad__head">
          <label className="notepad__view">
            <span className="sr-only">Show</span>
            <select value={listExists ? view : "today"} onChange={(e) => onData?.(id, { view: e.target.value })}>
              <option value="today">Today</option>
              <option value="all">All open</option>
              {lists.map((l) => <option key={l.id} value={`list:${l.id}`}>{l.name}</option>)}
            </select>
          </label>
          <span className="notepad__count">{shown.length}</span>
        </header>

        <ul className="rows notepad__rows">
          {shown.map((task) => {
            const children = subs.get(task.id) ?? [];
            return (
              <TaskRow key={task.id} task={task} today={today} compact subsDone={children.filter((c) => c.completed).length} subsTotal={children.length} color={colorOf.get(task.list_id) ?? null} onToggle={toggle} onOpen={onOpen} />
            );
          })}
        </ul>
        {status === "ready" && shown.length === 0 && <p className="notepad__empty">{effective.kind === "today" ? "Nothing due. A quiet day." : "Nothing here."}</p>}
        {status === "error" && <p className="notepad__empty">Couldn&apos;t load your tasks.</p>}

        {status === "ready" && <QuickAdd listId={target} dueDate={effective.kind === "today" ? today : null} lists={lists} today={today} placeholder="Add a task" />}
        <Link href="/todo" className="notepad__open">Open planner <BasicIcon icon="ArrowRight01Icon" size={14} /></Link>
      </div>

      {openTask && <TaskCard key={openTask.id} task={openTask} subtasks={subs.get(openTask.id) ?? []} lists={lists} onClose={closeCard} />}
    </BaseWidget>
  );
}

export default memo(TodoListWidget);
