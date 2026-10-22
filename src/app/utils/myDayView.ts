"use client";
import { useSyncExternalStore } from "react";

// "My day" has two views of the same things: the Board (widgets you arrange) and the Room (a cozy pixel room whose objects open
// the same widgets). Which one you were in is remembered in this browser, so you come back to the one you left.

export type MyDayView = "board" | "room";

const KEY = "personalhub:my-day-view";
const EVENT = "personalhub:my-day-view-change";
let remembered: MyDayView | null = null; // the answer if the browser will not store it

const valid = (value: unknown): value is MyDayView => value === "board" || value === "room";

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
};

const read = (): MyDayView => {
  if (remembered) return remembered;
  // a link that names a view wins on the very first paint, so the other view never flashes up first
  const asked = new URLSearchParams(window.location.search).get("view");
  if (valid(asked)) return asked;
  try {
    const stored = localStorage.getItem(KEY);
    if (valid(stored)) return stored;
  } catch {
    /* private window: use the default */
  }
  return "board";
};

export function setMyDayView(view: MyDayView) {
  remembered = view;
  try {
    localStorage.setItem(KEY, view);
  } catch {
    /* it lasts until the page is closed */
  }
  window.dispatchEvent(new Event(EVENT));
}

// null on the server and on the very first paint, so the page can wait instead of flashing the wrong view.
export const useMyDayView = (): MyDayView | null => useSyncExternalStore(subscribe, read, () => null);

// A link such as /dashboard?view=room picks the view once, then tidies the address.
export function applyViewFromAddress() {
  const wanted = new URLSearchParams(window.location.search).get("view");
  if (!valid(wanted)) return;
  setMyDayView(wanted);
  window.history.replaceState(null, "", window.location.pathname);
}
