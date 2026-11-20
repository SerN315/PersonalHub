"use client";
import { memo, useEffect, useRef } from "react";
import "@/app/styles/ui/player.scss";
import YouTubePlayer, { type YouTubeHandle } from "@/app/components/widgets/radio/YouTubePlayer";
import { registerYouTubeHandle, useYouTube, youtube } from "@/app/utils/radio/youtubeEngine";
import { useRadioStore } from "@/app/utils/radio/engine";

// The one YouTube player of the whole app. It is never moved in the page (an embedded player restarts if it is moved), so instead this
// frame is laid over the window of the radio widget that wants it, and follows it as the page scrolls, resizes or is rearranged. When no
// radio widget is on screen it sits in a small corner window, so a song carries on while you work elsewhere.

const hide = (frame: HTMLElement) => {
  frame.style.visibility = "hidden";
};

function PlayerLayer() {
  const source = useYouTube((state) => state.source);
  const autoplay = useYouTube((state) => state.autoplay);
  const slot = useYouTube((state) => state.slot);
  const shown = useYouTube((state) => state.started);
  const volume = useRadioStore((state) => state.volume);
  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<YouTubeHandle>(null);

  useEffect(() => {
    registerYouTubeHandle(source ? handleRef.current : null);
    return () => registerYouTubeHandle(null);
  }, [source]);

  // Follow the widget's window. Only the frame's style is written (never React state), and only when the box has really moved.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (!slot) {
      frame.removeAttribute("style");
      return;
    }
    let raf = 0;
    let last = "";
    const follow = () => {
      const box = slot.getBoundingClientRect();
      const key = `${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.width)},${Math.round(box.height)}`;
      if (key !== last) {
        last = key;
        const away = box.width < 2 || box.height < 2 || box.bottom < 0 || box.top > window.innerHeight || box.right < 0 || box.left > window.innerWidth;
        if (away) hide(frame);
        else Object.assign(frame.style, { visibility: "visible", left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, right: "auto", bottom: "auto" });
      }
      raf = requestAnimationFrame(follow);
    };
    follow();
    return () => {
      cancelAnimationFrame(raf);
      frame.removeAttribute("style");
    };
  }, [slot]);

  if (!source) return null;
  const mode = slot ? "is-slot" : shown ? "is-docked" : "is-parked";
  return (
    <div ref={frameRef} className={`playerLayer ${mode}`} aria-label={mode === "is-docked" ? "YouTube player" : undefined}>
      <YouTubePlayer ref={handleRef} playlistId={source.id} kind={source.kind} volume={volume} autoplay={autoplay} onInfo={youtube.setInfo} />
    </div>
  );
}

export default memo(PlayerLayer);
