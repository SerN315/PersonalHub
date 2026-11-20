import { api } from "./http";

// The notification inbox. The bell asks "anything after #N?" and the server answers with the news (or just the two numbers when there is none).

export type Source = "party" | "focus" | "webhook" | "test";

export interface NotificationItem {
  id: string;
  seq: number;
  source: Source;
  label: string | null; // the name another tool gave itself ("Jira")
  title: string;
  body: string | null;
  link: string | null; // a place inside the app ("/radio") or a secure web address
  read: boolean;
  created_at: string;
}

export interface Inbox {
  items: NotificationItem[]; // newest first
  unread: number;
  latest: number;
}

export interface NotificationSettings {
  sources: { party: boolean; focus: boolean };
  webhook: { enabled: boolean; createdAt: string | null };
}

export const getInbox = (since: number | undefined, signal?: AbortSignal) => api<Inbox>(since === undefined ? "/api/notifications" : `/api/notifications?since=${since}`, { signal });
export const markRead = (what: { all: true } | { ids: string[] }) => api<{ unread: number }>("/api/notifications/read", { method: "POST", body: what });
export const removeNotification = (id: string) => api<{ success: true }>(`/api/notifications/${id}`, { method: "DELETE" });
export const clearNotifications = () => api<{ removed: number }>("/api/notifications", { method: "DELETE" });
export const postNotification = (note: { source: "focus" | "test"; title: string; body?: string; link?: string }) =>
  api<{ created: boolean; notification: NotificationItem | null }>("/api/notifications", { method: "POST", body: note });

export const getNotificationSettings = () => api<NotificationSettings>("/api/notifications/settings");
export const saveSources = (sources: Partial<NotificationSettings["sources"]>) => api<NotificationSettings>("/api/notifications/settings", { method: "PUT", body: { sources } });
export const makeWebhook = () => api<{ token: string; path: string; enabled: boolean; createdAt: string }>("/api/notifications/webhook", { method: "POST", body: {} });
export const removeWebhook = () => api<{ success: true }>("/api/notifications/webhook", { method: "DELETE" });
