import { api } from "./http";
import type { Mode } from "@/app/utils/focus/timer";

export interface SessionToSave {
  id: string; // chosen by the browser, so saving the same session twice counts once
  kind: Mode;
  planned_secs: number;
  actual_secs: number;
  completed: boolean;
  started_at: string; // ISO time
  task_id?: string | null;
  task_label?: string | null;
}

export interface FocusSummary {
  today: { sessions: number; minutes: number };
  streak: number; // days in a row with a finished focus session
  week: { date: string; sessions: number; minutes: number }[]; // the last 14 days
  total: { sessions: number; minutes: number };
}

export const saveSession = (session: SessionToSave) => api<{ recorded: boolean }>("/api/focus/sessions", { method: "POST", body: session });
export const getFocusSummary = (today: string, tz: number) => api<FocusSummary>(`/api/focus/summary?today=${today}&tz=${tz}`);
