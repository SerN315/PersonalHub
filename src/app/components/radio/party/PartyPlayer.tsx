"use client";
import { memo, useEffect, useRef } from "react";
import { loadYouTubeApi } from "../../widgets/radio/YouTubePlayer";
import { sendPosition, skipSong, type PartySong } from "@/app/apis/party";
import { usePartyStore } from "@/app/utils/party/store";
import { useRadioStore } from "@/app/utils/radio/engine";

// The party's YouTube window. It plays whatever video or playlist the host chose. The host's place in a video is sent every few seconds;
// a guest who has drifted more than a few seconds away jumps back (it is "together", not "to the frame"). When the host's video ends,
// the host's page plays the next song in the line-up.

const BEAT_MS = 10_000;
const FRESH_MS = 25_000; // a place older than this is not trusted (the host may have paused)
const DRIFT_S = 3;

interface Player {
  playVideo: () => void;
  setVolume: (volume: number) => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  loadPlaylist: (options: { list: string; listType: string; index: number }) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

interface Props {
  song: PartySong; // a video or a playlist
  serverMs: number; // the server's clock when `song` was read
  host: boolean;
  partyId: string;
}

// where the host is now, if the last report is recent enough to trust
const hostPlace = (song: PartySong, serverMs: number) => (song.kind === "video" && song.posAtMs !== null && serverMs - song.posAtMs < FRESH_MS ? (song.posMs + serverMs - song.posAtMs) / 1000 : null);

function PartyPlayer({ song, serverMs, host, partyId }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const ready = useRef(false);
  const latest = useRef({ song, serverMs, host, partyId });
  useEffect(() => {
    latest.current = { song, serverMs, host, partyId };
  });

  // what to play: used when the player becomes ready and whenever the host picks something else
  const load = useRef(() => {});
  useEffect(() => {
    load.current = () => {
      const p = player.current;
      if (!p || !ready.current) return;
      const { song: s, serverMs: now, host: isHost } = latest.current;
      if (s.kind === "video") p.loadVideoById({ videoId: s.ref, startSeconds: isHost ? 0 : Math.max(0, hostPlace(s, now) ?? 0) });
      else p.loadPlaylist({ list: s.ref, listType: "playlist", index: 0 });
    };
  });

  useEffect(() => {
    let cancelled = false;
    const host = mountRef.current;
    if (!host) return;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        const mount = document.createElement("div");
        host.replaceChildren(mount);
        player.current = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: () => {
              ready.current = true;
              player.current?.setVolume(Math.round(useRadioStore.getState().volume * 100));
              load.current();
            },
            onStateChange: (event: { data: number }) => {
              // 0 = the video ended: the host's page moves the party on
              if (event.data === 0 && latest.current.host && latest.current.song.kind === "video") void usePartyStore.getState().act((id) => skipSong(id));
            },
          },
        }) as unknown as Player;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      ready.current = false;
      player.current?.destroy();
      player.current = null;
      host.replaceChildren();
    };
  }, []);

  // the host picked something else (or the same song again)
  useEffect(() => load.current(), [song.kind, song.ref, song.startedMs]);

  // guests: step back toward the host when they have drifted
  useEffect(() => {
    const p = player.current;
    if (host || !p || !ready.current) return;
    const target = hostPlace(song, serverMs);
    if (target !== null && Math.abs(p.getCurrentTime() - target) > DRIFT_S) p.seekTo(target, true);
  }, [song, serverMs, host]);

  // the host: say where we are, now and then
  useEffect(() => {
    if (!host || song.kind !== "video") return;
    const interval = setInterval(() => {
      const p = player.current;
      if (p && ready.current && p.getPlayerState() === 1) void sendPosition(partyId, p.getCurrentTime() * 1000).catch(() => {});
    }, BEAT_MS);
    return () => clearInterval(interval);
  }, [host, song.kind, song.ref, partyId]);

  // the volume knob on the radio is the volume here too
  useEffect(() => useRadioStore.subscribe((state, previous) => state.volume !== previous.volume && player.current?.setVolume(Math.round(state.volume * 100))), []);

  return <div ref={mountRef} className="partyVideo" />;
}

export default memo(PartyPlayer);
