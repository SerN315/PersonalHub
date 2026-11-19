"use client";
import { create } from "zustand";
import type { YouTubeHandle, YouTubeInfo } from "@/app/components/widgets/radio/YouTubePlayer";
import { useRadioStore } from "./engine";

// YouTube playback, outside React (like the radio's audio): the player belongs to the page, not to a widget, so a song or playlist keeps
// playing when you move to another tab of the hub. One player lives in the app's layout (PlayerLayer). While a radio widget is on screen the
// video appears in its window (the widget registers a "slot"); everywhere else it sits in a small corner window, because YouTube's rules
// say its player has to stay visible while it plays.

export interface YouTubeSource {
  kind: "video" | "playlist";
  id: string;
}

export const YT_IDLE: YouTubeInfo = { status: "idle", title: null, author: null, index: 0, count: 0, ids: [], error: null };

interface State {
  source: YouTubeSource | null;
  autoplay: boolean; // true only when a person just asked for it (a restored playlist never starts by itself)
  info: YouTubeInfo;
  started: boolean; // it has played at least once since it was chosen, so it is worth showing in the corner
  slot: HTMLElement | null; // where a radio widget wants the video
  views: number; // how many radio widgets are on screen (their own controls are enough then)
}

export const useYouTube = create<State>()(() => ({ source: null, autoplay: false, info: YT_IDLE, started: false, slot: null, views: 0 }));

let handle: YouTubeHandle | null = null;
export const registerYouTubeHandle = (next: YouTubeHandle | null) => {
  handle = next;
};

export const youtube = {
  // Choose what to play. The same thing again does nothing (so a widget coming back on screen never restarts the song), unless a person
  // pressed play on it.
  load(source: YouTubeSource, { autoplay }: { autoplay: boolean }) {
    const current = useYouTube.getState().source;
    if (current && current.kind === source.kind && current.id === source.id) {
      if (autoplay) handle?.play();
      return;
    }
    useYouTube.setState({ source, autoplay, info: { ...YT_IDLE, status: "loading" }, started: autoplay });
  },
  stop() {
    handle?.pause();
    useYouTube.setState({ source: null, autoplay: false, info: YT_IDLE, started: false });
  },
  play: () => handle?.play(),
  pause: () => handle?.pause(),
  next: () => handle?.next(),
  previous: () => handle?.previous(),
  playAt: (index: number) => handle?.playAt(index),
  setInfo(info: YouTubeInfo) {
    useYouTube.setState((state) => ({ info, started: state.started || info.status === "playing" }));
  },
  setSlot(slot: HTMLElement | null, only?: HTMLElement | null) {
    useYouTube.setState((state) => (only !== undefined && state.slot !== only ? state : { slot }));
  },
  addView(delta: 1 | -1) {
    useYouTube.setState((state) => ({ views: Math.max(0, state.views + delta) }));
  },
};

// Everything that makes sound, quieted together (the sleep timer, the corner player's stop button).
export function pauseAllMusic() {
  useRadioStore.getState().pause();
  youtube.pause();
}

// Only one thing should play at a time: starting a station quiets YouTube, and starting YouTube quiets the station.
useYouTube.subscribe((state, previous) => {
  if (state.info.status === "playing" && previous.info.status !== "playing") {
    const radio = useRadioStore.getState();
    if (radio.status === "playing" || radio.status === "loading") radio.pause();
  }
});
useRadioStore.subscribe((state, previous) => {
  if ((state.status === "loading" || state.status === "playing") && state.status !== previous.status && useYouTube.getState().info.status === "playing") handle?.pause();
});
