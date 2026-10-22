"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 700px)";

const subscribe = (notify: () => void) => {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", notify);
  return () => list.removeEventListener("change", notify);
};

// True on a phone-sized screen. The server and the first paint say "no", so the room is what first loads; a phone then swaps to
// its simple layout as soon as the page is running.
export const useIsMobile = () => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
