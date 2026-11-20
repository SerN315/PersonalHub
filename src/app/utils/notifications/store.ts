"use client";
import { create } from "zustand";
import { clearNotifications, getInbox, markRead, postNotification, removeNotification, type NotificationItem } from "@/app/apis/notifications";
import { groupNew, mergeItems, planAlert, pollDelay, toAnnounce, type Permission, type Presence } from "./alert";
import { notificationPrefs } from "./prefs";
import { armSound, playCue } from "./sound";

// The notification inbox, outside React (like the radio and the party): the bell, the cards and the settings all read this one store.
// It asks the server for news every so often (quickly while you look at the page, slowly when it is hidden), and only the first look
// downloads the list: after that the answer is just two numbers unless something is new.

export interface Toast {
  key: string;
  item: NotificationItem;
}

interface State {
  items: NotificationItem[];
  unread: number;
  latest: number;
  loaded: boolean;
  panelOpen: boolean;
  toasts: Toast[];
}

export const useNotifications = create<State>()(() => ({ items: [], unread: 0, latest: 0, loaded: false, panelOpen: false, toasts: [] }));

const ANNOUNCED_KEY = "personalhub:notification-announced"; // the newest number any open tab has announced, so two tabs never both chime
const MOST_CARDS = 3;

const presence = (): Presence => (document.visibilityState === "visible" && document.hasFocus() ? "focused" : "background");
const permission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

function claim(seq: number): boolean {
  try {
    const before = Number(localStorage.getItem(ANNOUNCED_KEY) ?? 0);
    if (seq <= before) return false;
    localStorage.setItem(ANNOUNCED_KEY, String(seq));
  } catch {
    /* private window: every tab announces, which is better than none */
  }
  return true;
}

// ---- telling the person --------------------------------------------------------------------------------------------------------------------

function showDesktop(item: NotificationItem) {
  try {
    const note = new Notification(item.title, { body: item.body ?? undefined, icon: "/favicon.ico", tag: `personalhub-${item.id}`, silent: true }); // silent: our own soft chime plays instead
    note.onclick = () => {
      window.focus();
      useNotifications.setState({ panelOpen: true });
      note.close();
    };
  } catch {
    /* some browsers only allow it from a service worker: the bell still counts it */
  }
}

function announce(arrived: NotificationItem[]) {
  const fresh = toAnnounce(arrived, new Set(), 0);
  if (fresh.length === 0) return;
  const newest = Math.max(...fresh.map((n) => n.seq));
  if (!claim(newest)) return;
  const plan = planAlert(notificationPrefs.get(), presence(), permission());
  const shown = groupNew(fresh);
  if (plan.sound) playCue();
  if (plan.desktop) shown.forEach(showDesktop);
  if (plan.toast) {
    useNotifications.setState((state) => ({
      toasts: [...state.toasts, ...shown.map((item) => ({ key: `${item.id}-${Date.now()}`, item }))].slice(-MOST_CARDS),
    }));
  }
}

export const dismissToast = (key: string) => useNotifications.setState((state) => (state.toasts.some((t) => t.key === key) ? { toasts: state.toasts.filter((t) => t.key !== key) } : state));
export const setPanel = (open: boolean) => useNotifications.setState({ panelOpen: open });

// ---- taking in what the server says -------------------------------------------------------------------------------------------------------

function take(answer: { items: NotificationItem[]; unread: number; latest: number }, { tell }: { tell: boolean }) {
  const before = useNotifications.getState();
  const known = new Set(before.items.map((n) => n.id));
  const arrived = answer.items.filter((n) => !known.has(n.id));
  const items = mergeItems(before.items, answer.items);
  if (items !== before.items || answer.unread !== before.unread || answer.latest !== before.latest || !before.loaded) {
    useNotifications.setState({ items, unread: answer.unread, latest: Math.max(before.latest, answer.latest), loaded: true });
  }
  // the very first look only fills the bell: old news is not announced as if it just happened
  if (tell && before.loaded) announce(arrived);
}

// ---- asking for news -------------------------------------------------------------------------------------------------------------------------

let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;
let running = false;
let failures = 0;
let lastAsked = 0;
let posting = 0; // while something of ours is on its way to the server, wait: it will be added by hand, quietly

async function ask() {
  if (!running || posting > 0) return schedule();
  controller?.abort();
  controller = new AbortController();
  lastAsked = Date.now();
  try {
    const { loaded, latest } = useNotifications.getState();
    take(await getInbox(loaded ? latest : undefined, controller.signal), { tell: true });
    failures = 0;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) failures += 1;
  }
  schedule();
}

function schedule() {
  clearTimeout(timer);
  if (!running) return;
  const state = document.visibilityState === "hidden" ? "hidden" : presence();
  timer = setTimeout(() => void ask(), pollDelay(state, failures));
}

// coming back to the page is the moment people expect fresh news
const wake = () => {
  if (running && Date.now() - lastAsked > 5000) void ask();
  else schedule();
};

export function startNotifications() {
  if (running) return stopNotifications;
  running = true;
  failures = 0;
  armSound();
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("focus", wake);
  void ask();
  return stopNotifications;
}

export function stopNotifications() {
  running = false;
  clearTimeout(timer);
  controller?.abort();
  document.removeEventListener("visibilitychange", wake);
  window.removeEventListener("focus", wake);
  useNotifications.setState({ items: [], unread: 0, latest: 0, loaded: false, panelOpen: false, toasts: [] });
}

// ---- things the person does ----------------------------------------------------------------------------------------------------------------

// Something this browser makes itself (a finished focus session, the test button). It goes to the server, comes back as one item, and is put
// in the list by hand so the next look for news does not announce it a second time. `tell` says whether to show it now.
export async function sendOwn(note: { source: "focus" | "test"; title: string; body?: string }, { tell }: { tell: boolean }) {
  posting += 1;
  try {
    const { created, notification } = await postNotification(note);
    if (!created || !notification) return false;
    const before = useNotifications.getState();
    useNotifications.setState({ items: mergeItems(before.items, [notification]), unread: before.unread + 1, latest: Math.max(before.latest, notification.seq), loaded: before.loaded });
    if (tell) announce([notification]);
    else claim(notification.seq);
    return true;
  } finally {
    posting -= 1;
  }
}

export async function readOne(id: string) {
  const state = useNotifications.getState();
  const target = state.items.find((n) => n.id === id);
  if (!target || target.read) return;
  useNotifications.setState({ items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)), unread: Math.max(0, state.unread - 1) });
  try {
    useNotifications.setState({ unread: (await markRead({ ids: [id] })).unread });
  } catch {
    /* the next look for news puts the numbers right */
  }
}

export async function readAll() {
  const state = useNotifications.getState();
  if (state.unread === 0) return;
  useNotifications.setState({ items: state.items.map((n) => (n.read ? n : { ...n, read: true })), unread: 0 });
  try {
    await markRead({ all: true });
  } catch {
    /* put right by the next look */
  }
}

export async function removeOne(id: string) {
  const state = useNotifications.getState();
  const target = state.items.find((n) => n.id === id);
  if (!target) return;
  useNotifications.setState({ items: state.items.filter((n) => n.id !== id), unread: target.read ? state.unread : Math.max(0, state.unread - 1) });
  try {
    await removeNotification(id);
  } catch {
    /* it comes back at the next first look if the server did not hear */
  }
}

export async function clearAll() {
  useNotifications.setState({ items: [], unread: 0 });
  try {
    await clearNotifications();
  } catch {
    /* as above */
  }
}
