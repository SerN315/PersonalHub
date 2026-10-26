"use client";
import { memo, useEffect, useRef } from "react";
import { loadYouTubeApi } from "../../widgets/radio/YouTubePlayer";
import { sendPosition, skipSong, type PartySong } from "@/app/apis/party";
import { hostMoved, hostPlace, planFollow } from "@/app/utils/party/follow";
import { usePartyStore } from "@/app/utils/party/store";
import { useRadioStore } from "@/app/utils/radio/engine";

// The party's YouTube window. It plays whatever video or playlist the host chose, and keeps everyone together:
//
//  - The HOST's page watches its own player every half second. A seek, a pause or play, or a new track in a playlist is reported at once
//    (a quarter of a second after it settles); while playing, the place is also reported every few seconds so nobody drifts.
//  - A GUEST's page applies what the host reports: it pauses and plays with the host, moves to the host's track, and jumps to the host's place
//    when it is more than a couple of seconds off. It only acts on a CHANGE of the host's pause or track, so a guest who pauses on their own
//    is not forced to play again (they are still pulled back into step if they are playing).
//
// Nobody can be perfectly in step across the internet; this aims for within a second or two.

const WATCH_MS = 500;
const HEARTBEAT_MS = 5000;
const SETTLE_MS = 250;

interface Player {
  playVideo: () => void;
  pauseVideo: () => void;
  playVideoAt: (index: number) => void;
  setVolume: (volume: number) => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  loadPlaylist: (options: { list: string; listType: string; index: number; startSeconds?: number }) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  getPlaylistIndex: () => number;
  getPlaylist: () => string[] | null;
  destroy: () => void;
}

interface Props {
  song: PartySong; // a video or a playlist
  serverMs: number; // the server's clock when `song` was read
  host: boolean;
  partyId: string;
  onTracks?: (tracks: { ids: string[]; index: number }) => void; // the playlist's songs and the one playing, when they change
  register?: (handle: { playAt: (index: number) => void } | null) => void; // lets the host's list jump to a song
}

function PartyPlayer({ song, serverMs, host, partyId, onTracks, register }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const ready = useRef(false);
  const latest = useRef({ song, serverMs, host, partyId, onTracks });
  useEffect(() => {
    latest.current = { song, serverMs, host, partyId, onTracks };
  });
  const lastTracks = useRef("");
  useEffect(() => {
    register?.({ playAt: (index) => player.current?.playVideoAt(index) });
    return () => register?.(null);
  }, [register]);
  // what this page has already done about the host's pause and track, so only a change is acted on
  const applied = useRef({ playing: true, index: 0 });
  const pauseWhenStarted = useRef(false); // joined while the host was paused: start the video, then hold it

  // what to play: used when the player becomes ready and whenever the host picks something else
  const load = useRef(() => {});
  useEffect(() => {
    load.current = () => {
      const p = player.current;
      if (!p || !ready.current) return;
      const { song: s, serverMs: now, host: isHost } = latest.current;
      const start = isHost ? 0 : Math.max(0, hostPlace(s, now));
      applied.current = { playing: s.playing, index: s.index };
      pauseWhenStarted.current = !isHost && !s.playing;
      if (s.kind === "video") p.loadVideoById({ videoId: s.ref, startSeconds: start });
      else p.loadPlaylist({ list: s.ref, listType: "playlist", index: isHost ? 0 : s.index, startSeconds: start });
    };
  });

  useEffect(() => {
    let cancelled = false;
    const holder = mountRef.current;
    if (!holder) return;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        const mount = document.createElement("div");
        holder.replaceChildren(mount);
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
              // tell the page which songs the playlist has and which one is playing (only when that changed)
              const p = player.current;
              if (p && latest.current.song.kind === "playlist") {
                const ids = p.getPlaylist?.() ?? [];
                const index = Math.max(0, p.getPlaylistIndex?.() ?? 0);
                const key = `${ids.length}:${index}`;
                if (ids.length > 0 && key !== lastTracks.current) {
                  lastTracks.current = key;
                  latest.current.onTracks?.({ ids, index });
                }
                // the last song of a playlist ended: the host's page moves the party on
                if (event.data === 0 && latest.current.host && ids.length > 0 && index >= ids.length - 1) void usePartyStore.getState().act((id) => skipSong(id));
              }
              if (event.data === 1 && pauseWhenStarted.current) {
                pauseWhenStarted.current = false;
                player.current?.pauseVideo();
              }
              // 0 = a single video ended: the host's page moves the party on
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
      holder.replaceChildren();
    };
  }, []);

  // the host picked something else (or the same song again)
  useEffect(() => load.current(), [song.kind, song.ref, song.startedMs]);

  // ---- guests: follow the host -----------------------------------------------------------------------------------------------
  useEffect(() => {
    const p = player.current;
    if (host || !p || !ready.current || pauseWhenStarted.current) return;
    const plan = planFollow(song, serverMs, applied.current, { state: p.getPlayerState(), time: p.getCurrentTime(), index: song.kind === "playlist" ? p.getPlaylistIndex() : 0 });
    applied.current = plan.seen;
    if (plan.goToTrack !== undefined) p.playVideoAt(plan.goToTrack);
    if (plan.play) p.playVideo();
    if (plan.pause) p.pauseVideo();
    if (plan.seekTo !== undefined) p.seekTo(plan.seekTo, true);
  }, [song, serverMs, host]);

  // ---- the host: say what is happening -----------------------------------------------------------------------------------------
  useEffect(() => {
    if (!host) return;
    let last = { time: 0, at: performance.now(), playing: false, index: 0 };
    let sentAt = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let primed = false;

    const read = () => {
      const p = player.current;
      if (!p || !ready.current) return null;
      const state = p.getPlayerState();
      const playing = state === 1 || (state === 3 && last.playing);
      return { time: p.getCurrentTime(), playing, index: latest.current.song.kind === "playlist" ? Math.max(0, p.getPlaylistIndex()) : 0 };
    };
    const send = () => {
      const now = read();
      if (!now) return;
      sentAt = performance.now();
      void sendPosition(latest.current.partyId, { posMs: now.time * 1000, playing: now.playing, index: now.index }).catch(() => {});
    };
    const soon = () => {
      clearTimeout(settle);
      settle = setTimeout(send, SETTLE_MS);
    };

    const interval = setInterval(() => {
      const now = read();
      if (!now) return;
      const at = performance.now();
      if (!primed) {
        // the first reading after a song loads only sets the baseline
        primed = now.playing;
        last = { ...now, at };
        return;
      }
      const moved = hostMoved(last, now, (at - last.at) / 1000);
      last = { ...now, at };
      if (moved) soon();
      else if (now.playing && at - sentAt > HEARTBEAT_MS) send();
    }, WATCH_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(settle);
    };
  }, [host, song.kind, song.ref, song.startedMs]);

  // the volume knob on the radio is the volume here too (each person's own: it is never shared)
  useEffect(() => useRadioStore.subscribe((state, previous) => state.volume !== previous.volume && ready.current && player.current?.setVolume(Math.round(state.volume * 100))), []);

  return <div ref={mountRef} className="partyVideo" />;
}

export default memo(PartyPlayer);
