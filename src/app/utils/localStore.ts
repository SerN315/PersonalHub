"use client";
import { useSyncExternalStore } from "react";

// A small value kept in this browser (localStorage) and read as React state. The server and the first paint always see `empty`, and the
// real value appears right after, so the page never disagrees with itself. Every read is checked by `clean`, because stored text is untrusted.
export function createLocalStore<T>(key: string, clean: (raw: unknown) => T, empty: T) {
  const EVENT = `personalhub:store:${key}`;
  let lastRaw: string | null | undefined;
  let lastValue: T = empty;

  const read = (): T => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      /* private window: nothing is remembered */
    }
    if (raw === lastRaw) return lastValue; // the same text gives the very same object, which React needs
    lastRaw = raw;
    try {
      lastValue = raw === null ? empty : clean(JSON.parse(raw));
    } catch {
      lastValue = empty;
    }
    return lastValue;
  };

  const subscribe = (notify: () => void) => {
    window.addEventListener("storage", notify);
    window.addEventListener(EVENT, notify);
    return () => {
      window.removeEventListener("storage", notify);
      window.removeEventListener(EVENT, notify);
    };
  };

  return {
    use: () => useSyncExternalStore(subscribe, read, () => empty),
    get: read,
    set(value: T) {
      lastRaw = JSON.stringify(value);
      lastValue = clean(value);
      try {
        localStorage.setItem(key, lastRaw);
      } catch {
        /* it lasts until the page is closed */
      }
      window.dispatchEvent(new Event(EVENT));
    },
  };
}
