"use client";
import { useEffect, useRef } from "react";
import { youtube } from "@/app/utils/radio/youtubeEngine";

// An empty window in a radio widget. The app's one YouTube player (PlayerLayer) is laid over it while it is on screen, and goes back to
// the corner when it is not.
export default function YouTubeSlot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    youtube.setSlot(element);
    return () => youtube.setSlot(null, element);
  }, []);
  return <div ref={ref} className="ytSlot" />;
}
