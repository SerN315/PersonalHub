import type { Task } from "../../apis/todo.ts";
import { addDays, dayLabel, diffDays } from "./dates.ts";

// Which tasks each page of the planner shows, and in what order. Pure functions over the tasks already on the page, so
// switching view, searching and filtering are instant and need no round trip.
//
// Subtasks are never listed on their own: they appear under their task. A view looks at the TASK'S own date and state.

export type Scope =
  | { kind: "today" } // open, due today or overdue
  | { kind: "upcoming" } // open and dated: an agenda
  | { kind: "all" } // every open task, in every list
  | { kind: "done" }
  | { kind: "list"; id: string } // one list, in the order you arranged it
  | { kind: "date"; iso: string }; // open tasks due on one day

export interface Filters {
  q: string;
  tag: string | null;
  minPriority: number;
}
export const NO_FILTERS: Filters = { q: "", tag: null, minPriority: 0 };

const topLevel = (tasks: Task[]) => tasks.filter((t) => t.parent_id === null);

// due date, then time (untimed last), then priority (high first), then the order you arranged
export function byDue(a: Task, b: Task) {
  if (a.due_date !== b.due_date) return a.due_date === null ? 1 : b.due_date === null ? -1 : a.due_date < b.due_date ? -1 : 1;
  if (a.due_time !== b.due_time) return a.due_time === null ? 1 : b.due_time === null ? -1 : a.due_time < b.due_time ? -1 : 1;
  return b.priority - a.priority || a.order_index - b.order_index || a.id.localeCompare(b.id, undefined, { numeric: true });
}
export const byManual = (a: Task, b: Task) => a.order_index - b.order_index || a.id.localeCompare(b.id, undefined, { numeric: true });
const byCompleted = (a: Task, b: Task) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "") || b.id.localeCompare(a.id, undefined, { numeric: true });

export function matchesFilters(task: Task, subtasks: Task[], f: Filters) {
  if (f.minPriority && task.priority < f.minPriority) return false;
  if (f.tag && !task.tags.some((t) => t.toLowerCase() === f.tag!.toLowerCase())) return false;
  const q = f.q.trim().toLowerCase();
  if (!q) return true;
  const haystack = [task.text, task.notes, ...task.tags, ...subtasks.map((s) => s.text)].join("\n").toLowerCase();
  return haystack.includes(q);
}

export function subtasksByParent(tasks: Task[]) {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.parent_id === null) continue;
    const list = map.get(task.parent_id) ?? [];
    list.push(task);
    map.set(task.parent_id, list);
  }
  for (const list of map.values()) list.sort(byManual);
  return map;
}

export function selectTasks(tasks: Task[], scope: Scope, filters: Filters, today: string): Task[] {
  const subs = subtasksByParent(tasks);
  const pass = (t: Task) => matchesFilters(t, subs.get(t.id) ?? [], filters);
  const open = topLevel(tasks).filter((t) => !t.completed && pass(t));

  switch (scope.kind) {
    case "today":
      return open.filter((t) => t.due_date !== null && t.due_date <= today).sort(byDue);
    case "upcoming":
      return open.filter((t) => t.due_date !== null).sort(byDue);
    case "all":
      return open.sort(byDue);
    case "date":
      return open.filter((t) => t.due_date === scope.iso).sort(byDue);
    case "list":
      return open.filter((t) => t.list_id === scope.id).sort(byManual);
    case "done":
      return topLevel(tasks).filter((t) => t.completed && pass(t)).sort(byCompleted);
  }
}

// Finished tasks of one list, newest first (shown folded away under the list).
export const doneInList = (tasks: Task[], listId: string) => topLevel(tasks).filter((t) => t.completed && t.list_id === listId).sort(byCompleted);

export interface AgendaGroup {
  key: string;
  label: string;
  iso: string | null;
  overdue: boolean;
  tasks: Task[];
}

// The upcoming page: Overdue, Today, Tomorrow, then each later day.
export function agenda(tasks: Task[], today: string): AgendaGroup[] {
  const groups: AgendaGroup[] = [];
  for (const task of tasks) {
    const overdue = task.due_date! < today;
    const key = overdue ? "overdue" : task.due_date!;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: overdue ? "Overdue" : dayLabel(task.due_date!, today), iso: overdue ? null : task.due_date, overdue, tasks: [] };
      groups.push(group);
    }
    group.tasks.push(task);
  }
  return groups;
}

export interface Counts {
  overdue: number;
  today: number;
  upcoming: number; // dated and still ahead
  nodate: number;
  open: number;
  done: number;
}
export function countTasks(tasks: Task[], today: string): Counts {
  const counts: Counts = { overdue: 0, today: 0, upcoming: 0, nodate: 0, open: 0, done: 0 };
  for (const t of topLevel(tasks)) {
    if (t.completed) counts.done++;
    else {
      counts.open++;
      if (t.due_date === null) counts.nodate++;
      else if (t.due_date < today) counts.overdue++;
      else if (t.due_date === today) counts.today++;
      else counts.upcoming++;
    }
  }
  return counts;
}

// open dated tasks per day: the little dots on the calendar
export function dueDots(tasks: Task[]) {
  const dots = new Map<string, number>();
  for (const t of topLevel(tasks)) if (!t.completed && t.due_date) dots.set(t.due_date, (dots.get(t.due_date) ?? 0) + 1);
  return dots;
}

export function tagCounts(tasks: Task[]) {
  const counts = new Map<string, { tag: string; n: number }>();
  for (const t of topLevel(tasks)) {
    if (t.completed) continue;
    for (const tag of t.tags) {
      const key = tag.toLowerCase();
      counts.set(key, { tag: counts.get(key)?.tag ?? tag, n: (counts.get(key)?.n ?? 0) + 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
}

export type DueState = "overdue" | "today" | "soon" | "later" | "none";
export function dueState(task: Pick<Task, "due_date" | "completed">, today: string): DueState {
  if (!task.due_date || task.completed) return "none";
  const diff = diffDays(task.due_date, today);
  return diff < 0 ? "overdue" : diff === 0 ? "today" : diff <= 3 ? "soon" : "later";
}

// How far along a task with subtasks is
export const progress = (subs: Task[]) => ({ done: subs.filter((s) => s.completed).length, total: subs.length });

// "Move to the next day" helpers for the quick actions on a row
export const tomorrow = (today: string) => addDays(today, 1);
