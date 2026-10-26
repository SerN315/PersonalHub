"use client";
import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";

// Plays a YouTube / YouTube Music playlist through YouTube's official IFrame Player. (There is no official API for
// playing YouTube Music itself; the same playlists play through this player.) The player must stay visible, which is
// why it is a real window on the radio and not a hidden audio-only element.

export interface YouTubeInfo {
  status: "idle" | "loading" | "playing" | "paused" | "error";
  title: string | null;
  index: number;
  count: number;
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
  getVideoData: () => { title?: string };
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
  100: "That playlist is private or no longer exists.",
  101: "The owner doesn't allow this to play outside YouTube.",
  150: "The owner doesn't allow this to play outside YouTube.",
};

interface Props {
  playlistId: string;
  volume: number; // 0..1
  autoplay?: boolean;
  onInfo: (info: YouTubeInfo) => void;
}

const YouTubePlayer = forwardRef<YouTubeHandle, Props>(function YouTubePlayer({ playlistId, volume, autoplay = false, onInfo }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loadedList = useRef<string | null>(null);
  const volumeRef = useRef(volume);
  const autoplayRef = useRef(autoplay);
  const onInfoRef = useRef(onInfo);
  useEffect(() => {
    volumeRef.current = volume;
    autoplayRef.current = autoplay;
    onInfoRef.current = onInfo;
    playerRef.current?.setVolume(Math.round(volume * 100));
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
    onInfoRef.current({ status: "loading", title: null, index: 0, count: 0, error: null });

    const report = (status: YouTubeInfo["status"], error: string | null = null) => {
      const player = playerRef.current;
      if (!player || cancelled) return;
      const list = player.getPlaylist?.() ?? [];
      onInfoRef.current({ status, title: player.getVideoData?.().title || null, index: Math.max(0, player.getPlaylistIndex?.() ?? 0), count: list?.length ?? 0, error });
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        if (playerRef.current) {
          // Already have a player: only a different playlist needs anything done
          if (loadedList.current !== playlistId) {
            playerRef.current.loadPlaylist({ list: playlistId, listType: "playlist", index: 0 });
            loadedList.current = playlistId;
          }
          return;
        }
        const mount = document.createElement("div"); // the API swaps this element for the iframe
        host.replaceChildren(mount);
        loadedList.current = playlistId;
        playerRef.current = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { listType: "playlist", list: playlistId, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
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
      .catch(() => !cancelled && onInfoRef.current({ status: "error", title: null, index: 0, count: 0, error: "YouTube couldn't be loaded. Check your connection." }));

    return () => {
      cancelled = true;
    };
  }, [playlistId]);

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
