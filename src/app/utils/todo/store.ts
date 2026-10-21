import { create } from "zustand";
import * as api from "@/app/apis/todo";
import type { NewTask, Task, TaskChanges, TodoList } from "@/app/apis/todo";
import { localToday, msUntilMidnight } from "./dates";

// The planner's data. One store for the whole page, shared by the Today widget and the planner tab, so a task ticked in one
// is ticked in the other, and each component subscribes to just the slice it shows. Changes show at once and are confirmed
// by the server afterwards; if the server says no, the page goes back to how it was and says so.

export interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

interface TodoState {
  status: "idle" | "loading" | "ready" | "error";
  tasks: Task[];
  lists: TodoList[];
  today: string;
  toast: Toast | null;
  load: () => Promise<void>;
  add: (task: NewTask) => Promise<Task | null>;
  toggle: (id: string) => void;
  patch: (id: string, changes: TaskChanges) => void;
  remove: (id: string) => void;
  reorder: (listId: string, ids: string[]) => void;
  clearDone: (listId?: string) => void;
  addList: (name: string, color?: string | null) => Promise<TodoList | null>;
  renameList: (id: string, changes: { name?: string; color?: string | null }) => void;
  removeList: (id: string) => void;
  dismissToast: () => void;
}

const DELETE_DELAY_MS = 5000;
let toastId = 0;
let loading: Promise<void> | null = null;
const pendingDeletes = new Map<string, ReturnType<typeof setTimeout>>();
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let midnightTimer: ReturnType<typeof setTimeout> | undefined;

const withId = (id: string, changes: Partial<Task>) => (tasks: Task[]) => tasks.map((t) => (t.id === id ? { ...t, ...changes } : t));
const replace = (task: Task) => (tasks: Task[]) => tasks.map((t) => (t.id === task.id ? task : t));

export const useTodoStore = create<TodoState>((set, get) => {
  const say = (message: string, undo?: () => void) => {
    clearTimeout(toastTimer);
    const toast = { id: ++toastId, message, undo };
    set({ toast });
    toastTimer = setTimeout(() => get().toast?.id === toast.id && set({ toast: null }), undo ? 6000 : 4000);
  };
  const fail = (message: string) => say(message);

  // Puts one task back to how it was if the server refused a change.
  const restore = (before: Task | undefined, message: string) => {
    if (before) set((s) => ({ tasks: replace(before)(s.tasks) }));
    fail(message);
  };

  const scheduleMidnight = () => {
    clearTimeout(midnightTimer);
    midnightTimer = setTimeout(() => {
      set({ today: localToday() });
      scheduleMidnight();
    }, msUntilMidnight());
  };

  return {
    status: "idle",
    tasks: [],
    lists: [],
    today: localToday(),
    toast: null,

    load: () => {
      if (get().status === "ready") return Promise.resolve();
      loading ??= (async () => {
        set({ status: "loading", today: localToday() });
        try {
          const [tasks, lists] = await Promise.all([api.getAllTasks(), api.getLists()]);
          set({ tasks, lists, status: "ready" });
          scheduleMidnight();
        } catch {
          set({ status: "error" });
        } finally {
          loading = null;
        }
      })();
      return loading;
    },

    add: async (input) => {
      try {
        const task = await api.createTask(input);
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      } catch (e) {
        fail(e instanceof Error ? e.message : "Couldn't add that task.");
        return null;
      }
    },

    toggle: (id) => {
      const before = get().tasks.find((t) => t.id === id);
      if (!before) return;
      const repeating = before.repeat_unit !== null;
      const completed = !before.completed;
      // a repeating task is never "done": it moves on to its next date, which only the server works out
      if (!repeating) set((s) => ({ tasks: withId(id, { completed, completed_at: completed ? new Date().toISOString() : null })(s.tasks) }));
      api.updateTask(id, { completed, today: get().today })
        .then(async (task) => {
          set((s) => ({ tasks: replace(task)(s.tasks) }));
          if (repeating) {
            // its subtasks start again too: pick up the fresh copy
            const fresh = await api.getAllTasks().catch(() => null);
            if (fresh) set({ tasks: fresh });
          }
          if (completed) say(repeating ? "Done. See you next time." : "Marked done.", () => get().toggle(id));
        })
        .catch(() => restore(before, "Couldn't update that task."));
    },

    patch: (id, changes) => {
      const before = get().tasks.find((t) => t.id === id);
      if (!before) return;
      const { today: _today, repeat, ...plain } = changes;
      void _today;
      set((s) => ({
        tasks: withId(id, {
          ...plain,
          ...(repeat !== undefined ? { repeat_every: repeat?.every ?? null, repeat_unit: repeat?.unit ?? null } : {}),
        } as Partial<Task>)(s.tasks),
      }));
      api.updateTask(id, changes)
        .then((task) => set((s) => ({ tasks: replace(task)(s.tasks) })))
        .catch((e) => restore(before, e instanceof Error && e.message ? e.message : "Couldn't save your changes."));
    },

    remove: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;
      const gone = new Set([id, ...get().tasks.filter((t) => t.parent_id === id).map((t) => t.id)]);
      const removed = get().tasks.filter((t) => gone.has(t.id));
      set((s) => ({ tasks: s.tasks.filter((t) => !gone.has(t.id)) }));
      // the task leaves the page now, but is only deleted for real after a few seconds, so "Undo" is a true undo
      const timer = setTimeout(() => {
        pendingDeletes.delete(id);
        api.deleteTask(id).catch(() => {
          set((s) => ({ tasks: [...s.tasks, ...removed] }));
          fail("Couldn't delete that task.");
        });
      }, DELETE_DELAY_MS);
      pendingDeletes.set(id, timer);
      say("Task removed.", () => {
        clearTimeout(pendingDeletes.get(id));
        pendingDeletes.delete(id);
        set((s) => ({ tasks: [...s.tasks, ...removed] }));
      });
    },

    reorder: (listId, ids) => {
      const before = get().tasks;
      const position = new Map(ids.map((id, i) => [id, i]));
      set((s) => ({ tasks: s.tasks.map((t) => (position.has(t.id) ? { ...t, order_index: position.get(t.id)! } : t)) }));
      api.reorderTasks(listId, ids).catch(() => {
        set({ tasks: before });
        fail("Couldn't save the new order.");
      });
    },

    clearDone: (listId) => {
      const done = get().tasks.filter((t) => t.completed && t.parent_id === null && (!listId || t.list_id === listId));
      if (!done.length) return;
      const gone = new Set(done.map((t) => t.id));
      const before = get().tasks;
      set((s) => ({ tasks: s.tasks.filter((t) => !gone.has(t.id) && !(t.parent_id && gone.has(t.parent_id))) }));
      api.bulkTasks("delete", [...gone]).catch(() => {
        set({ tasks: before });
        fail("Couldn't clear those.");
      });
    },

    addList: async (name, color) => {
      try {
        const list = await api.createList({ name, color });
        set((s) => ({ lists: [...s.lists, list] }));
        return list;
      } catch (e) {
        fail(e instanceof Error ? e.message : "Couldn't add that list.");
        return null;
      }
    },

    renameList: (id, changes) => {
      const before = get().lists;
      set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...changes } : l)) }));
      api.updateList(id, changes).catch(() => {
        set({ lists: before });
        fail("Couldn't save that list.");
      });
    },

    removeList: (id) => {
      const { lists, tasks } = get();
      set({ lists: lists.filter((l) => l.id !== id), tasks: tasks.filter((t) => t.list_id !== id) });
      api.deleteList(id).catch(() => {
        set({ lists, tasks });
        fail("Couldn't delete that list.");
      });
    },

    dismissToast: () => set({ toast: null }),
  };
});

// A deleted task must really be deleted if the person leaves during the undo window.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const [id, timer] of pendingDeletes) {
      clearTimeout(timer);
      void fetch(`/api/todo/tasks/${id}`, { method: "DELETE", keepalive: true, credentials: "same-origin" });
    }
    pendingDeletes.clear();
  });
}
