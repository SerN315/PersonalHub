import type { NotificationItem } from "@/app/apis/notifications";

// The small decisions behind the notification inbox, as plain functions so they can be tested without a browser.

export interface Prefs {
  popup: boolean; // a card on the page while you are looking at it
  sound: boolean; // a soft chime
  desktop: boolean; // a message from your computer when the page is in the background (the browser must allow it)
}
export const DEFAULT_PREFS: Prefs = { popup: true, sound: true, desktop: false };

export function cleanPrefs(raw: unknown): Prefs {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const flag = (name: keyof Prefs) => (typeof r[name] === "boolean" ? (r[name] as boolean) : DEFAULT_PREFS[name]);
  return { popup: flag("popup"), sound: flag("sound"), desktop: flag("desktop") };
}

export type Presence = "focused" | "background";
export type Permission = "granted" | "denied" | "default" | "unsupported";

export interface Plan {
  toast: boolean;
  sound: boolean;
  desktop: boolean;
}

// Looking at the page: a card and the chime. Somewhere else: your computer's own message and the chime. Never both messages, and a card
// that nobody is there to see is not shown (the bell and the tab title still count it).
export function planAlert(prefs: Prefs, presence: Presence, permission: Permission): Plan {
  if (presence === "focused") return { toast: prefs.popup, sound: prefs.sound, desktop: false };
  return { toast: false, sound: prefs.sound, desktop: prefs.desktop && permission === "granted" };
}

// A lot arriving at once (a tool that was quiet, then posted ten) becomes one summary, not ten cards and ten chimes.
export const MOST_AT_ONCE = 3;
export function groupNew(items: NotificationItem[]): NotificationItem[] {
  if (items.length <= MOST_AT_ONCE) return items;
  const newest = items[0];
  return [{ ...newest, id: `many-${newest.id}`, source: "test", label: null, title: `${items.length} new notifications`, body: newest.title, link: null }];
}

// Which of the newly arrived are worth announcing: not read, not announced before (by this or another open tab).
export const toAnnounce = (arrived: NotificationItem[], known: ReadonlySet<string>, announcedSeq: number) =>
  arrived.filter((item) => !item.read && !known.has(item.id) && item.seq > announcedSeq);

// Merge new items into the list: no repeats, newest first, never more than `max` (the server keeps the same number).
export function mergeItems(current: NotificationItem[], arrived: NotificationItem[], max = 100): NotificationItem[] {
  if (arrived.length === 0) return current;
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of arrived) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => b.seq - a.seq).slice(0, max);
}

// How long the person has to wait before the next look for news: quickly while they look at the page, slowly when it is hidden, and
// slower still after failures.
export function pollDelay(presence: Presence | "hidden", failures: number): number {
  const base = presence === "focused" ? 20_000 : presence === "background" ? 60_000 : 120_000;
  return Math.min(base * 2 ** Math.min(failures, 4), 300_000);
}

export function titleWithCount(title: string, unread: number): string {
  const bare = title.replace(/^\(\d+\+?\)\s*/, "");
  return unread > 0 ? `(${unread > 99 ? "99+" : unread}) ${bare}` : bare;
}

export function timeAgo(from: string | number | Date, now: number = Date.now()): string {
  const secs = Math.max(0, Math.round((now - new Date(from).getTime()) / 1000));
  if (!Number.isFinite(secs)) return "";
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

// Where a link goes: inside the app, or out to a secure address. Anything else is not followed (the server already drops it).
export function whereTo(link: string | null): { kind: "app"; path: string } | { kind: "web"; url: string } | null {
  if (!link) return null;
  if (/^\/(?![/\\])/.test(link)) return { kind: "app", path: link };
  try {
    const url = new URL(link);
    return url.protocol === "https:" ? { kind: "web", url: url.href } : null;
  } catch {
    return null;
  }
}
