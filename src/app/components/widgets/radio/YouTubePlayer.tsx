"use client";
import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";

// Plays a YouTube / YouTube Music playlist through YouTube's official IFrame Player. (There is no official API for
// playing YouTube Music itself; the same playlists play through this player.) The player must stay visible, which is
// why it is a real window on the radio and not a hidden audio-only element.

export interface YouTubeInfo {
  status: "idle" | "loading" | "playing" | "paused" | "error";
  title: string | null;
  author: string | null; // the channel
  index: number;
  count: number;
  ids: string[]; // the video ids of the playlist, in order (one id for a single song)
  error: string | null;
}

export interface YouTubeHandle {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  playAt: (index: number) => void;
}

// The small part of the IFrame API this file uses.
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  playVideoAt: (index: number) => void;
  setVolume: (volume: number) => void;
  loadPlaylist: (options: { list: string; listType: string; index: number }) => void;
  loadVideoById: (videoId: string) => void;
  getVideoData: () => { title?: string; author?: string };
  getPlaylist: () => string[] | null;
  getPlaylistIndex: () => number;
  destroy: () => void;
}
export interface YTApi {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTApi> | null = null;
export function loadYouTubeApi(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise<YTApi>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script"); // injected by our own (nonce'd) script, which the CSP's strict-dynamic allows
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube could not be loaded"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

const ERRORS: Record<number, string> = {
  2: "That playlist link doesn't look right.",
  5: "YouTube had a playback problem. Try again.",
  100: "That is private or no longer exists.",
  101: "The owner doesn't allow this to play outside YouTube.",
  150: "The owner doesn't allow this to play outside YouTube.",
};

interface Props {
  playlistId: string; // the playlist's id, or the video's id when kind is "video"
  kind?: "playlist" | "video";
  volume: number; // 0..1
  autoplay?: boolean;
  onInfo: (info: YouTubeInfo) => void;
}

const YouTubePlayer = forwardRef<YouTubeHandle, Props>(function YouTubePlayer({ playlistId, kind = "playlist", volume, autoplay = false, onInfo }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loadedList = useRef<string | null>(null);
  const volumeRef = useRef(volume);
  const autoplayRef = useRef(autoplay);
  const onInfoRef = useRef(onInfo);
  const sourceRef = useRef({ kind, id: playlistId }); // read by the player's events, which are set up once
  useEffect(() => {
    sourceRef.current = { kind, id: playlistId };
    volumeRef.current = volume;
    autoplayRef.current = autoplay;
    onInfoRef.current = onInfo;
    // the player object exists before YouTube has attached its methods to it, so ask first
    if (typeof playerRef.current?.setVolume === "function") playerRef.current.setVolume(Math.round(volume * 100));
  });

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    next: () => playerRef.current?.nextVideo(),
    previous: () => playerRef.current?.previousVideo(),
    playAt: (index) => playerRef.current?.playVideoAt(index),
  }));

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    onInfoRef.current({ status: "loading", title: null, author: null, index: 0, count: 0, ids: [], error: null });

    const report = (status: YouTubeInfo["status"], error: string | null = null) => {
      const player = playerRef.current;
      if (!player || cancelled) return;
      const { kind: now, id } = sourceRef.current;
      const list = now === "video" ? [id] : (player.getPlaylist?.() ?? []);
      const data = player.getVideoData?.();
      onInfoRef.current({ status, title: data?.title || null, author: data?.author || null, index: now === "video" ? 0 : Math.max(0, player.getPlaylistIndex?.() ?? 0), count: list?.length ?? 0, ids: list ?? [], error });
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        if (playerRef.current) {
          // Already have a player: only a different playlist needs anything done
          if (loadedList.current !== `${kind}:${playlistId}`) {
            if (kind === "video") playerRef.current.loadVideoById(playlistId);
            else playerRef.current.loadPlaylist({ list: playlistId, listType: "playlist", index: 0 });
            loadedList.current = `${kind}:${playlistId}`;
          }
          return;
        }
        const mount = document.createElement("div"); // the API swaps this element for the iframe
        host.replaceChildren(mount);
        loadedList.current = `${kind}:${playlistId}`;
        playerRef.current = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          videoId: kind === "video" ? playlistId : undefined,
          playerVars: { ...(kind === "video" ? {} : { listType: "playlist", list: playlistId }), playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: () => {
              playerRef.current?.setVolume(Math.round(volumeRef.current * 100));
              if (autoplayRef.current) playerRef.current?.playVideo();
              report("paused");
            },
            onStateChange: (event: { data: number }) => {
              // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
              if (event.data === 1) report("playing");
              else if (event.data === 3) report("loading");
              else report("paused");
            },
            onError: (event: { data: number }) => report("error", ERRORS[event.data] ?? "YouTube couldn't play that."),
          },
        });
      })
      .catch(() => !cancelled && onInfoRef.current({ status: "error", title: null, author: null, index: 0, count: 0, ids: [], error: "YouTube couldn't be loaded. Check your connection." }));

    return () => {
      cancelled = true;
    };
  }, [playlistId, kind]);

  // Leaving YouTube (or the page) removes the player entirely, so nothing keeps playing out of sight.
  useEffect(() => {
    const host = hostRef.current;
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      loadedList.current = null;
      host?.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="ytHost" />;
});

export default memo(YouTubePlayer);
