import { create } from "zustand";
import { ApiError } from "@/app/apis/http";
import { Conflict, createNote, deleteNote, getNote, listNotes, saveWhileLeaving, updateNote, type Changes, type Note, type NoteColor, type NoteSummary } from "@/app/apis/notes";

// The notebook's state. What you type is a DRAFT that is saved a moment after you stop typing, again before you leave the note or the page,
// and never while another save is still on its way. If the note was changed somewhere else (another tab), the save is refused rather than
// overwriting it, and you choose which version to keep.

const SAVE_DELAY_MS = 800;
const RETRY_MS = 5000;

export type SaveState = "saved" | "dirty" | "saving" | "offline" | "conflict" | "error";
interface Draft {
  title: string;
  body: string;
}

interface NotesState {
  status: "idle" | "loading" | "ready" | "error";
  items: NoteSummary[];
  query: string;
  activeId: string | null;
  active: Note | null; // the note as the server last gave it
  draft: Draft | null; // what is on the page now
  save: SaveState;
  saveError: string | null;
  conflict: Note | null; // the server's newer copy, when there is one
  savedAt: number | null;
  load: () => Promise<void>;
  search: (query: string) => Promise<void>;
  open: (id: string) => Promise<void>;
  leave: () => Promise<void>;
  create: (initial?: { title?: string; body?: string }) => Promise<void>;
  edit: (patch: Partial<Draft>) => void;
  saveNow: () => Promise<void>;
  setColor: (color: NoteColor) => Promise<void>;
  togglePin: () => Promise<void>;
  remove: () => Promise<void>;
  useTheirs: () => void;
  keepMineAsNew: () => Promise<void>;
}

// the same tidying the server does to a title
export const tidyTitle = (title: string) => title.replace(/\s+/g, " ").trim();
const preview = (body: string) => body.replace(/\s+/g, " ").slice(0, 140);
export const isDirty = (active: Note | null, draft: Draft | null) => !!active && !!draft && (tidyTitle(draft.title) !== active.title || draft.body !== active.body);

const summary = (note: Note): NoteSummary => ({ id: note.id, title: note.title, preview: preview(note.body), size: new TextEncoder().encode(note.body).length, pinned: note.pinned, color: note.color, version: note.version, created_at: note.created_at, updated_at: note.updated_at });
// pinned first, then the most recently changed (the same order the server uses)
const order = (items: NoteSummary[]) => [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));
const withNote = (items: NoteSummary[], note: Note) => order(items.some((i) => i.id === note.id) ? items.map((i) => (i.id === note.id ? summary(note) : i)) : [summary(note), ...items]);
const messageOf = (error: unknown) => (error instanceof Error && error.message ? error.message : "Could not save");

let timer: ReturnType<typeof setTimeout> | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;
let searchSeq = 0;

export const useNotesStore = create<NotesState>((set, get) => {
  const schedule = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => void get().saveNow(), ms);
  };

  // Saves what is pending (if anything) before moving on.
  const settle = async () => {
    clearTimeout(timer);
    const { active, draft, save } = get();
    if (isDirty(active, draft) && save !== "conflict") await get().saveNow();
  };

  const show = (note: Note) => set({ activeId: note.id, active: note, draft: { title: note.title, body: note.body }, save: "saved", saveError: null, conflict: null, savedAt: null });

  return {
    status: "idle",
    items: [],
    query: "",
    activeId: null,
    active: null,
    draft: null,
    save: "saved",
    saveError: null,
    conflict: null,
    savedAt: null,

    load: async () => {
      if (get().status === "loading") return;
      set({ status: "loading" });
      try {
        set({ items: await listNotes(get().query), status: "ready" });
      } catch {
        set({ status: "error" });
      }
    },

    search: async (query) => {
      const mine = ++searchSeq;
      set({ query });
      try {
        const items = await listNotes(query.trim());
        if (mine === searchSeq) set({ items });
      } catch {
        /* keep showing what is there */
      }
    },

    open: async (id) => {
      if (get().activeId === id) return;
      await settle();
      try {
        show(await getNote(id));
      } catch {
        set({ saveError: "Could not open that note" });
      }
    },

    leave: async () => {
      await settle();
      set({ activeId: null, active: null, draft: null, save: "saved", conflict: null });
    },

    create: async (initial = {}) => {
      await settle();
      try {
        const note = await createNote(initial);
        set((s) => ({ items: withNote(s.items, note) }));
        show(note);
      } catch (error) {
        set({ saveError: messageOf(error) });
      }
    },

    edit: (patch) => {
      const { draft, save } = get();
      if (!draft || save === "conflict") return;
      set({ draft: { ...draft, ...patch }, save: save === "saving" ? "saving" : "dirty" });
      schedule(SAVE_DELAY_MS);
    },

    saveNow: async () => {
      const { active, draft, save } = get();
      if (!active || !draft || save === "saving" || save === "conflict") return;
      const changes: Changes = {};
      if (tidyTitle(draft.title) !== active.title) changes.title = draft.title;
      if (draft.body !== active.body) changes.body = draft.body;
      if (Object.keys(changes).length === 0) return void set({ save: "saved" });
      changes.version = active.version;
      const id = active.id;
      set({ save: "saving", saveError: null });
      try {
        const note = await updateNote(id, changes);
        const now = get();
        if (now.activeId !== id) return void set({ items: withNote(now.items, note) }); // you moved on: just keep the list fresh
        set({ active: note, items: withNote(now.items, note), savedAt: Date.now(), save: "saved" });
        // you kept typing while it was being saved: save again
        if (isDirty(get().active, get().draft)) {
          set({ save: "dirty" });
          schedule(SAVE_DELAY_MS);
        }
      } catch (error) {
        if (error instanceof Conflict) return void set({ save: "conflict", conflict: error.current });
        if (error instanceof ApiError && error.status === 0) {
          set({ save: "offline" });
          clearTimeout(retry);
          retry = setTimeout(() => void get().saveNow(), RETRY_MS);
          return;
        }
        set({ save: "error", saveError: messageOf(error) });
      }
    },

    setColor: async (color) => {
      const { active } = get();
      if (!active || active.color === color) return;
      set({ active: { ...active, color }, items: get().items.map((i) => (i.id === active.id ? { ...i, color } : i)) });
      try {
        await updateNote(active.id, { color });
      } catch (error) {
        set({ active, items: get().items.map((i) => (i.id === active.id ? { ...i, color: active.color } : i)), saveError: messageOf(error) });
      }
    },

    togglePin: async () => {
      const { active } = get();
      if (!active) return;
      const pinned = !active.pinned;
      set((s) => ({ active: { ...active, pinned }, items: order(s.items.map((i) => (i.id === active.id ? { ...i, pinned } : i))) }));
      try {
        await updateNote(active.id, { pinned });
      } catch (error) {
        set((s) => ({ active, items: order(s.items.map((i) => (i.id === active.id ? { ...i, pinned: active.pinned } : i))), saveError: messageOf(error) }));
      }
    },

    remove: async () => {
      const { active, items } = get();
      if (!active) return;
      clearTimeout(timer);
      try {
        await deleteNote(active.id);
      } catch (error) {
        return void set({ saveError: messageOf(error) });
      }
      set({ items: items.filter((i) => i.id !== active.id), activeId: null, active: null, draft: null, save: "saved", conflict: null });
    },

    useTheirs: () => {
      const { conflict } = get();
      if (conflict) {
        show(conflict);
        set((s) => ({ items: withNote(s.items, conflict) }));
      }
    },

    // Keep what is on the page as a new note (so nothing you wrote is lost), and leave the other copy as it is.
    keepMineAsNew: async () => {
      const { draft } = get();
      if (!draft) return;
      try {
        const note = await createNote({ title: tidyTitle(draft.title).slice(0, 100) + " (my copy)", body: draft.body });
        set((s) => ({ items: withNote(s.items, note) }));
        show(note);
      } catch (error) {
        set({ saveError: messageOf(error) });
      }
    },
  };
});

// Leaving the page with something unsaved: send it on its way (the request is allowed to finish after the page is gone).
export function saveBeforeLeaving() {
  const { active, draft, save } = useNotesStore.getState();
  if (!active || !draft || save === "conflict" || !isDirty(active, draft)) return;
  const changes: Changes = { version: active.version };
  if (tidyTitle(draft.title) !== active.title) changes.title = draft.title;
  if (draft.body !== active.body) changes.body = draft.body;
  saveWhileLeaving(active.id, changes);
}
