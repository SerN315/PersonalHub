import { create } from "zustand";
import { getNowPlaying, type Station } from "@/app/apis/radio";

// The radio's audio engine. It lives OUTSIDE React on purpose: the <audio> element and its state belong to the page,
// not to the widget, so the music keeps playing when you switch to another tab of the hub (Dictionary, settings...)
// and the dashboard widget is just a view of this state.

export type RadioStatus = "idle" | "loading" | "playing" | "paused" | "error";

interface RadioState {
  station: Station | null;
  status: RadioStatus;
  title: string | null; // the song the station says it is playing
  volume: number; // 0..1
  error: string | null;
  // Pick a station without playing it (used to restore your last one).
  select: (station: Station | null) => void;
  tune: (station: Station) => void; // select and play
  toggle: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
}

const NOW_PLAYING_EVERY_MS = 25_000;

let audio: HTMLAudioElement | null = null;
let poller: ReturnType<typeof setInterval> | undefined;

function getAudio() {
  if (audio || typeof Audio === "undefined") return audio;
  audio = new Audio();
  audio.preload = "none";
  audio.volume = useRadioStore.getState().volume;
  audio.addEventListener("playing", () => useRadioStore.setState({ status: "playing", error: null }));
  audio.addEventListener("waiting", () => audio && !audio.paused && useRadioStore.setState({ status: "loading" }));
  audio.addEventListener("pause", () => {
    const { status } = useRadioStore.getState();
    if (status === "playing" || status === "loading") useRadioStore.setState({ status: "paused" });
  });
  audio.addEventListener("error", () => {
    if (!audio?.src) return;
    useRadioStore.setState({ status: "error", error: "This station isn't reachable right now. Try another one." });
  });
  audio.addEventListener("ended", () => useRadioStore.setState({ status: "error", error: "The stream ended." }));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pollNowPlaying(); // catch up the moment you come back to the tab
  });
  return audio;
}

async function pollNowPlaying() {
  const { station, status } = useRadioStore.getState();
  if (!station || status !== "playing" || document.hidden) return;
  try {
    const title = await getNowPlaying(station.id);
    if (useRadioStore.getState().station?.id === station.id) useRadioStore.setState({ title });
  } catch {
    /* a station that announces nothing is normal; keep the last title */
  }
}

function startPolling() {
  stopPolling();
  pollNowPlaying();
  poller = setInterval(pollNowPlaying, NOW_PLAYING_EVERY_MS);
}
function stopPolling() {
  clearInterval(poller);
  poller = undefined;
}

// Lock-screen / keyboard media keys and the browser's media widget.
function updateMediaSession(station: Station | null, title: string | null) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  if (!station) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: title || station.name, artist: title ? station.name : "PersonalHub Radio" });
}

export const useRadioStore = create<RadioState>()((set, get) => ({
  station: null,
  status: "idle",
  title: null,
  volume: 0.7,
  error: null,

  select: (station) => {
    const element = getAudio();
    if (element) {
      element.pause();
      element.removeAttribute("src");
      element.load();
    }
    stopPolling();
    set({ station, status: "idle", title: null, error: null });
  },

  tune: (station) => {
    const element = getAudio();
    if (!element) return;
    set({ station, status: "loading", title: null, error: null });
    element.src = station.url;
    element.play().catch((error: unknown) => {
      // A newer tune() interrupting this one is expected while turning the knob: not an error.
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (get().station?.id === station.id) set({ status: "error", error: "This station isn't reachable right now. Try another one." });
    });
    updateMediaSession(station, null);
  },

  toggle: () => {
    const { station, status } = get();
    if (!station) return;
    if (status === "playing" || status === "loading") return get().pause();
    get().tune(station); // from paused, idle or error: (re)open the stream, which also catches up to "live"
  },

  pause: () => {
    const element = getAudio();
    stopPolling();
    set({ status: "paused" });
    element?.pause();
    if (element) {
      element.removeAttribute("src"); // a radio has no "resume": drop the stream so nothing keeps downloading
      element.load();
    }
  },

  setVolume: (volume) => {
    const clamped = Math.min(1, Math.max(0, volume));
    set({ volume: clamped });
    if (audio) audio.volume = clamped;
  },
}));

// Poll for the song only while something is playing, and follow the state changes that matter.
useRadioStore.subscribe((state, previous) => {
  if (state.status !== previous.status) {
    if (state.status === "playing") startPolling();
    else stopPolling();
  }
  if (state.title !== previous.title) updateMediaSession(state.station, state.title);
});

if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => useRadioStore.getState().toggle());
  navigator.mediaSession.setActionHandler("pause", () => useRadioStore.getState().pause());
}
