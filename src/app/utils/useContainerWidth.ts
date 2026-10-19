import { useEffect, useRef, useState } from "react";

// Width of an element, kept current with a ResizeObserver. Re-renders only when the width actually changes.
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth((prev) => (prev === Math.round(el.clientWidth) ? prev : Math.round(el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
