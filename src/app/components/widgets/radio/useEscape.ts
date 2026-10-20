import { useEffect, useRef } from "react";

// Calls `onEscape` when Escape is pressed anywhere on the page while the caller is mounted. Listening on the document
// (not on the panel) matters: a re-render can remove the focused button, and focus then falls back to the page itself.
export function useEscape(onEscape: () => void) {
  const latest = useRef(onEscape);
  useEffect(() => {
    latest.current = onEscape;
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) latest.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}
