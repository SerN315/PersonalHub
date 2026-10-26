import { ApiError, api } from "./http";

export type NoteColor = "paper" | "butter" | "peach" | "rose" | "sage" | "sky" | "lilac";
export const NOTE_COLORS: NoteColor[] = ["paper", "butter", "peach", "rose", "sage", "sky", "lilac"];

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  color: NoteColor;
  version: number; // goes up every time the words change
  created_at: string;
  updated_at: string;
}

// what the list shows: a short preview instead of the whole text
export interface NoteSummary extends Omit<Note, "body"> {
  preview: string;
  size: number;
}

export interface Changes {
  title?: string;
  body?: string;
  color?: NoteColor;
  pinned?: boolean;
  version?: number; // required when the words change: the version you last saw
}

// The note changed somewhere else since you opened it: the server sends back what it has now.
export class Conflict extends Error {
  constructor(readonly current: Note) {
    super("This note was changed somewhere else");
  }
}

export const listNotes = (q = "") => api<NoteSummary[]>(`/api/notes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
export const getNote = (id: string) => api<Note>(`/api/notes/${id}`);
export const createNote = (note: Partial<Pick<Note, "title" | "body" | "color" | "pinned">> = {}) => api<Note>("/api/notes", { method: "POST", body: note });
export const deleteNote = (id: string) => api<{ success: true }>(`/api/notes/${id}`, { method: "DELETE" });

export async function updateNote(id: string, changes: Changes) {
  try {
    return await api<Note>(`/api/notes/${id}`, { method: "PATCH", body: changes });
  } catch (error) {
    const current = error instanceof ApiError && error.status === 409 ? (error.data as { current?: Note } | null)?.current : undefined;
    if (current) throw new Conflict(current);
    throw error;
  }
}

// Used when the page is closing: a normal request might be cut off, so this one is allowed to finish after the page is gone.
export function saveWhileLeaving(id: string, changes: Changes) {
  try {
    void fetch(`/api/notes/${id}`, { method: "PATCH", keepalive: true, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
  } catch {
    /* nothing more can be done as the page closes */
  }
}
