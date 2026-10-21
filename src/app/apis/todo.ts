import { api } from "./http";

export type RepeatUnit = "day" | "weekday" | "week" | "month" | "year";
export type Priority = 0 | 1 | 2 | 3;

export interface Task {
  id: string;
  list_id: string;
  parent_id: string | null; // a subtask points at its task (one level only)
  text: string;
  notes: string;
  color: string | null;
  tags: string[];
  priority: Priority;
  due_date: string | null; // "YYYY-MM-DD": that day, wherever you are
  due_time: string | null; // "HH:MM"
  repeat_every: number | null;
  repeat_unit: RepeatUnit | null;
  completed: boolean;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TodoList {
  id: string;
  name: string;
  color: string | null;
  order_index: number;
  open: number; // open tasks in the list
}

export interface Summary {
  overdue: number;
  today: number;
  upcoming: number;
  nodate: number;
  open: number;
  doneToday: number;
  streak: number; // days in a row with something done
  week: { date: string; count: number }[]; // the last 14 days
  lists: TodoList[];
}

export interface NewTask {
  text: string;
  list_id?: string;
  parent_id?: string | null;
  notes?: string;
  tags?: string[];
  priority?: Priority;
  color?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  repeat?: { every: number; unit: RepeatUnit } | null;
}

export type TaskChanges = Partial<Omit<NewTask, "parent_id">> & {
  completed?: boolean;
  order_index?: number;
  today?: string; // lets a repeating task land after today when it is finished late
};

// The server numbers tasks with big integers; the page treats every id as text so nothing ever rounds one off.
const normalize = (raw: Task & { id: string | number; parent_id: string | number | null }): Task => ({ ...raw, id: String(raw.id), parent_id: raw.parent_id === null ? null : String(raw.parent_id) });

const PAGE = 500;

// Everything the person has, in as few round trips as possible (views, search and filters then work instantly on this copy).
export async function getAllTasks(): Promise<Task[]> {
  const all: Task[] = [];
  for (let offset = 0; offset < 20_000; offset += PAGE) {
    const page = await api<Task[]>(`/api/todo/tasks?view=all&limit=${PAGE}&offset=${offset}`);
    all.push(...page.map(normalize));
    if (page.length < PAGE) break;
  }
  return all;
}

export const getTasks = async (query: Record<string, string>) => (await api<Task[]>(`/api/todo/tasks?${new URLSearchParams(query)}`)).map(normalize);
export const getLists = () => api<TodoList[]>("/api/todo/lists");
export const createList = (list: { name: string; color?: string | null }) => api<TodoList>("/api/todo/lists", { method: "POST", body: list });
export const updateList = (id: string, changes: { name?: string; color?: string | null; order_index?: number }) => api<TodoList>(`/api/todo/lists/${id}`, { method: "PATCH", body: changes });
export const deleteList = (id: string) => api<null>(`/api/todo/lists/${id}`, { method: "DELETE" });

export const createTask = async (task: NewTask) => normalize(await api<Task>("/api/todo/tasks", { method: "POST", body: task }));
export const updateTask = async (id: string, changes: TaskChanges) => normalize(await api<Task>(`/api/todo/tasks/${id}`, { method: "PATCH", body: changes }));
export const deleteTask = (id: string) => api<null>(`/api/todo/tasks/${id}`, { method: "DELETE" });
export const reorderTasks = (listId: string, ids: string[]) => api("/api/todo/tasks/reorder", { method: "POST", body: { list_id: listId, ids } });
export const bulkTasks = (action: "complete" | "delete" | "move", ids: string[], extra: { list_id?: string; today?: string } = {}) =>
  api<{ applied: number }>("/api/todo/tasks/bulk", { method: "POST", body: { action, ids, ...extra } });
export const getSummary = (today: string, tz: number) => api<Summary>(`/api/todo/summary?today=${today}&tz=${tz}`);
