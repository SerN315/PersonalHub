"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BasicIcon from "../ultis/icons";
import QuickAdd from "./QuickAdd";
import TaskRow from "./TaskRow";
import TaskCard from "./TaskCard";
import MiniCalendar from "./MiniCalendar";
import DayPage from "./DayPage";
import { useTodoStore } from "@/app/utils/todo/store";
import { agenda, countTasks, doneInList, dueDots, NO_FILTERS, selectTasks, subtasksByParent, tagCounts, type Filters, type Scope } from "@/app/utils/todo/views";
import { dayLabel } from "@/app/utils/todo/dates";
import type { Task } from "@/app/apis/todo";
import "@/app/styles/pages/planner.scss";

const FALLBACK_COLORS = ["var(--c-clay)", "var(--c-sage)", "var(--c-sky)", "var(--c-lilac)", "var(--c-rose)", "var(--c-butter)"];
const LIST_COLORS = ["#c46f4a", "#7c9d77", "#5e96b8", "#9c84bd", "#d4687d", "#e0ad2f"];

const sameScope = (a: Scope, b: Scope) => a.kind === b.kind && (("id" in a && "id" in b && a.id === b.id) || ("iso" in a && "iso" in b && a.iso === b.iso) || (!("id" in a) && !("iso" in a)));

export default function Planner() {
  const status = useTodoStore((s) => s.status);
  const tasks = useTodoStore((s) => s.tasks);
  const lists = useTodoStore((s) => s.lists);
  const today = useTodoStore((s) => s.today);
  const toast = useTodoStore((s) => s.toast);
  const load = useTodoStore((s) => s.load);
  const toggle = useTodoStore((s) => s.toggle);
  const reorder = useTodoStore((s) => s.reorder);
  const clearDone = useTodoStore((s) => s.clearDone);
  const addList = useTodoStore((s) => s.addList);
  const renameList = useTodoStore((s) => s.renameList);
  const removeList = useTodoStore((s) => s.removeList);
  const dismissToast = useTodoStore((s) => s.dismissToast);

  const [picked, setScope] = useState<Scope>({ kind: "today" });
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newList, setNewList] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  // if the list on screen was deleted, fall back to Today
  const scope: Scope = useMemo(() => (picked.kind === "list" && status === "ready" && !lists.some((l) => l.id === picked.id) ? { kind: "today" } : picked), [picked, lists, status]);

  const counts = useMemo(() => countTasks(tasks, today), [tasks, today]);
  const subs = useMemo(() => subtasksByParent(tasks), [tasks]);
  const dots = useMemo(() => dueDots(tasks), [tasks]);
  const tags = useMemo(() => tagCounts(tasks), [tasks]);
  const shown = useMemo(() => selectTasks(tasks, scope, filters, today), [tasks, scope, filters, today]);
  const colorOf = useMemo(() => new Map(lists.map((l, i) => [l.id, l.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]])), [lists]);
  const openCount = useMemo(() => {
    const n = new Map<string, number>();
    for (const t of tasks) if (!t.completed && t.parent_id === null) n.set(t.list_id, (n.get(t.list_id) ?? 0) + 1);
    return n;
  }, [tasks]);

  const onOpen = useCallback((id: string) => setOpenId(id), []);
  const closeCard = useCallback(() => setOpenId(null), []);

  const inList = scope.kind === "list";
  const onDragStart = useCallback((id: string) => void (dragId.current = id), []);
  const onDrop = useCallback(
    (targetId: string) => {
      const from = dragId.current;
      dragId.current = null;
      if (!inList || !from || from === targetId) return;
      const ids = shown.map((t) => t.id);
      const a = ids.indexOf(from);
      const b = ids.indexOf(targetId);
      if (a < 0 || b < 0) return;
      ids.splice(b, 0, ...ids.splice(a, 1));
      reorder(scope.id, ids);
    },
    [inList, shown, scope, reorder],
  );
  const onMove = useCallback(
    (id: string, direction: -1 | 1) => {
      if (!inList) return;
      const ids = shown.map((t) => t.id);
      const a = ids.indexOf(id);
      const b = a + direction;
      if (a < 0 || b < 0 || b >= ids.length) return;
      [ids[a], ids[b]] = [ids[b], ids[a]];
      reorder(scope.id, ids);
    },
    [inList, shown, scope, reorder],
  );

  const row = (task: Task) => {
    const children = subs.get(task.id) ?? [];
    return (
      <TaskRow
        key={task.id}
        task={task}
        today={today}
        subsDone={children.filter((c) => c.completed).length}
        subsTotal={children.length}
        color={colorOf.get(task.list_id) ?? null}
        onToggle={toggle}
        onOpen={onOpen}
        onMove={inList && !filters.q ? onMove : undefined}
        onDragStart={inList && !filters.q ? onDragStart : undefined}
        onDrop={inList && !filters.q ? onDrop : undefined}
      />
    );
  };

  const currentList = scope.kind === "list" ? lists.find((l) => l.id === scope.id) : undefined;
  const defaultListId = currentList?.id ?? lists[0]?.id ?? null;
  const openTask = openId ? tasks.find((t) => t.id === openId) : undefined;
  const doneHere = currentList ? doneInList(tasks, currentList.id) : [];

  const heading =
    scope.kind === "today" ? "Today" : scope.kind === "upcoming" ? "Coming up" : scope.kind === "all" ? "Everything open" : scope.kind === "done" ? "Finished" : scope.kind === "date" ? dayLabel(scope.iso, today) : currentList?.name ?? "";

  const tab = (s: Scope, label: string, n?: number, color?: string) => (
    <li key={label + (("id" in s && s.id) || "")}>
      <button type="button" className={`tab ${sameScope(scope, s) ? "is-active" : ""}`} aria-current={sameScope(scope, s) ? "page" : undefined} style={color ? ({ ["--tab" as string]: color } as React.CSSProperties) : undefined} onClick={() => (setScope(s), setConfirmDelete(false))}>
        <span>{label}</span>
        {n ? <b>{n}</b> : null}
      </button>
    </li>
  );

  const body = () => {
    if (status === "error") return <p className="page__empty">Couldn&apos;t open your planner. <button type="button" onClick={() => (useTodoStore.setState({ status: "idle" }), void load())}>Try again</button></p>;
    if (status !== "ready") return <p className="page__empty" aria-busy="true">Opening your planner...</p>;
    if (shown.length === 0 && scope.kind !== "list") {
      return <p className="page__empty">{filters.q || filters.tag || filters.minPriority ? "Nothing matches that." : scope.kind === "today" ? "Nothing due. A quiet day?" : scope.kind === "done" ? "Nothing finished yet." : "Nothing here."}</p>;
    }
    if (scope.kind === "upcoming") {
      return agenda(shown, today).map((g) => (
        <section key={g.key} className={g.overdue ? "group group--overdue" : "group"}>
          <h3>{g.label}</h3>
          <ul className="rows">{g.tasks.map(row)}</ul>
        </section>
      ));
    }
    return (
      <>
        <ul className="rows">{shown.map(row)}</ul>
        {scope.kind === "list" && shown.length === 0 && <p className="page__empty">This page is blank. Write the first line above.</p>}
        {scope.kind === "list" && doneHere.length > 0 && (
          <div className="group">
            <button type="button" className="group__toggle" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
              <BasicIcon icon="ArrowDown01Icon" size={14} className={showDone ? "" : "turn"} /> {doneHere.length} finished
            </button>
            {showDone && <ul className="rows">{doneHere.map(row)}</ul>}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="planner">
      <div className="book">
        <div className="book__binding" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</div>

        <aside className="book__left">
          <DayPage today={today} open={counts.open} overdue={counts.overdue} dueToday={counts.today} doneCount={counts.done} />
          <MiniCalendar today={today} selected={scope.kind === "date" ? scope.iso : null} dots={dots} onPick={(iso) => setScope({ kind: "date", iso })} />
        </aside>

        <section className="book__right" aria-label={heading}>
          <header className="page__head">
            {currentList ? (
              <input className="page__title" key={currentList.id} defaultValue={currentList.name} maxLength={40} aria-label="List name" onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== currentList.name && renameList(currentList.id, { name: e.target.value.trim() })} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
            ) : (
              <h1 className="page__title">{heading}</h1>
            )}
            <div className="page__tools">
              <label className="search"><BasicIcon icon="Search01Icon" size={15} /><span className="sr-only">Search tasks</span>
                <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Search" maxLength={80} />
              </label>
              <label className="prio"><span className="sr-only">Show priority</span>
                <select value={filters.minPriority} onChange={(e) => setFilters({ ...filters, minPriority: Number(e.target.value) })}>
                  <option value={0}>Any priority</option><option value={1}>Low and up</option><option value={2}>Medium and up</option><option value={3}>High only</option>
                </select>
              </label>
              {scope.kind === "done" && counts.done > 0 && <button type="button" className="mini" onClick={() => clearDone()}>Clear finished</button>}
              {currentList && lists.length > 1 && (
                <button type="button" className={`mini mini--danger ${confirmDelete ? "is-armed" : ""}`} onClick={() => (confirmDelete ? removeList(currentList.id) : setConfirmDelete(true))} onBlur={() => setConfirmDelete(false)}>
                  <BasicIcon icon="Delete02Icon" size={14} /> {confirmDelete ? "Tap again to delete the list" : "Delete list"}
                </button>
              )}
            </div>
          </header>

          {tags.length > 0 && (
            <ul className="tagbar" aria-label="Filter by tag">
              {tags.slice(0, 10).map(({ tag, n }) => (
                <li key={tag}><button type="button" className={`washi ${filters.tag?.toLowerCase() === tag.toLowerCase() ? "is-on" : ""}`} aria-pressed={filters.tag?.toLowerCase() === tag.toLowerCase()} onClick={() => setFilters({ ...filters, tag: filters.tag?.toLowerCase() === tag.toLowerCase() ? null : tag })}>{tag} <small>{n}</small></button></li>
              ))}
            </ul>
          )}

          {scope.kind !== "done" && status === "ready" && (
            <QuickAdd listId={defaultListId} dueDate={scope.kind === "today" ? today : scope.kind === "date" ? scope.iso : null} lists={lists} today={today} />
          )}

          <div className="paper">{body()}</div>
        </section>

        <nav className="book__tabs" aria-label="Pages">
          <ul>
            {tab({ kind: "today" }, "Today", counts.today + counts.overdue)}
            {tab({ kind: "upcoming" }, "Coming up", counts.upcoming)}
            {tab({ kind: "all" }, "All open", counts.open)}
            {lists.map((l, i) => tab({ kind: "list", id: l.id }, l.name, openCount.get(l.id) ?? 0, colorOf.get(l.id) ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]))}
            {tab({ kind: "done" }, "Finished", counts.done)}
          </ul>
          <form className="newtab" onSubmit={async (e) => {
            e.preventDefault();
            const name = newList.trim();
            if (!name) return;
            const list = await addList(name, LIST_COLORS[lists.length % LIST_COLORS.length]);
            if (list) {
              setNewList("");
              setScope({ kind: "list", id: list.id });
            }
          }}>
            <label><span className="sr-only">New list</span><input value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="+ New list" maxLength={40} /></label>
          </form>
        </nav>
      </div>

      {openTask && <TaskCard key={openTask.id} task={openTask} subtasks={subs.get(openTask.id) ?? []} lists={lists} onClose={closeCard} />}

      {toast && (
        <div className="postit" role="status" key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo && <button type="button" onClick={() => (toast.undo?.(), dismissToast())}><BasicIcon icon="Undo02Icon" size={14} /> Undo</button>}
          <button type="button" className="postit__x" onClick={dismissToast} aria-label="Dismiss"><BasicIcon icon="Cancel01Icon" size={14} /></button>
        </div>
      )}
    </div>
  );
}
