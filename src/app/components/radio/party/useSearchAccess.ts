"use client";
import { useEffect, useState } from "react";
import { getSearchAccess } from "@/app/apis/radio";

const AGAIN_MS = 60_000;

// May this person search YouTube right now? The owner decides who (Settings, Admin), so it is asked when the box opens, again every minute,
// and again when the tab comes back to the front, so a change the owner makes reaches people without a reload. Not knowing means "no".
export function useSearchAccess(): boolean {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const ask = () =>
      getSearchAccess()
        .then((answer) => !cancelled && setAllowed(answer))
        .catch(() => !cancelled && setAllowed(false));
    void ask();
    const timer = setInterval(ask, AGAIN_MS);
    const back = () => document.visibilityState === "visible" && void ask();
    document.addEventListener("visibilitychange", back);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", back);
    };
  }, []);
  return allowed;
}
