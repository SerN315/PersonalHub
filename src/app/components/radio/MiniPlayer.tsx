"use client";
import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BasicIcon from "@/app/components/ultis/icons";
import { useRadioStore } from "@/app/utils/radio/engine";
import { useYouTube, youtube } from "@/app/utils/radio/youtubeEngine";
import { useUserStore } from "@/app/utils/store/userStore";
import { Button } from "@/app/components/ui";

// A small "now playing" bar for every page, so the music can be paused, skipped or closed without going back to the Radio. It stays out of
// the way: it only appears while something is playing (or paused), and not at all on a page that already shows a radio.
function MiniPlayer() {
  const pathname = usePathname();
  const signedIn = useUserStore((state) => state.user !== null);
  const station = useRadioStore((state) => state.station);
  const radioStatus = useRadioStore((state) => state.status);
  const radioTitle = useRadioStore((state) => state.title);
  const source = useYouTube((state) => state.source);
  const started = useYouTube((state) => state.started);
  const info = useYouTube((state) => state.info);
  const views = useYouTube((state) => state.views);

  const radioActive = !!station && (radioStatus === "playing" || radioStatus === "loading" || radioStatus === "paused");
  const videoActive = !!source && started;
  if (!signedIn || pathname.startsWith("/auth/") || views > 0 || (!radioActive && !videoActive)) return null;

  const video = videoActive && !radioActive ? true : videoActive && info.status === "playing";
  const playing = video ? info.status === "playing" : radioStatus === "playing" || radioStatus === "loading";
  const name = video ? info.title || "YouTube" : station?.name ?? "Radio";
  const detail = video ? info.author : radioTitle;

  const toggle = () => (video ? (playing ? youtube.pause() : youtube.play()) : useRadioStore.getState().toggle());
  const close = () => {
    if (video) youtube.stop();
    else useRadioStore.getState().select(null);
  };

  return (
    <section className={`miniPlayer ${playing ? "is-on" : ""}`} aria-label="Now playing">
      <span className="miniPlayer__lamp" aria-hidden />
      <Link href="/radio" className="miniPlayer__text" title="Open the radio">
        <strong>{name}</strong>
        {detail && <small>{detail}</small>}
      </Link>
      <div className="miniPlayer__keys">
        {video && (
          <Button variant="bare" onClick={youtube.previous} aria-label="Previous track" disabled={info.count < 2}>
            <BasicIcon icon="PreviousIcon" size={16} />
          </Button>
        )}
        <Button variant="bare" className="miniPlayer__play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          <BasicIcon icon={playing ? "PauseIcon" : "PlayIcon"} size={18} />
        </Button>
        {video && (
          <Button variant="bare" onClick={youtube.next} aria-label="Next track" disabled={info.count < 2}>
            <BasicIcon icon="NextIcon" size={16} />
          </Button>
        )}
        <Button variant="bare" onClick={close} aria-label="Close the player">
          <BasicIcon icon="Cancel01Icon" size={15} />
        </Button>
      </div>
    </section>
  );
}

export default memo(MiniPlayer);
