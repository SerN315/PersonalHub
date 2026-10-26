import { create } from "zustand";
import { ApiError } from "@/app/apis/http";
import * as party from "@/app/apis/party";
import { useRadioStore } from "@/app/utils/radio/engine";
import type { ChatEvent, PartyState, Reaction } from "@/app/apis/party";
import { hasMessage, mergeChat, type ChatMessage } from "./chat";
import { shareState } from "./share";

// The party you are in. It lives outside React so the music (which follows the host) keeps going while you move around the hub, and so
// one timer asks the server for news (every few seconds, slower when the tab is in the background) however many parts of the page look.

const POLL_MS = 2500;
const VIDEO_MS = 1200; // while a video is playing, so a seek or a pause reaches you quickly
const HIDDEN_MS = 10_000;
const OFFLINE_MS = 6000;
const CHAT_MS = 800; // while people are talking (and for a while after), so a message arrives in under a second
const CHAT_WINDOW_MS = 20_000;
const MAX_FLOATING = 12;

export type PartyStatus = "none" | "loading" | "active" | "ended";

export interface Floating {
  key: number;
  emoji: string;
  name: string;
  mine: boolean;
}

interface PartyStore {
  status: PartyStatus;
  party: PartyState | null;
  message: string | null; // the last thing that went wrong, in plain words
  online: boolean;
  floating: Floating[];
  messages: ChatMessage[]; // the chat, as shown
  restore: () => Promise<void>;
  start: (name: string) => Promise<boolean>;
  join: (code: string) => Promise<boolean>;
  leave: () => Promise<void>;
  end: () => Promise<void>;
  act: (call: (id: string) => Promise<unknown>) => Promise<boolean>; // a control (host or guest): runs it, then fetches the result at once
  react: (emoji: string) => void;
  say: (text: string) => Promise<boolean>;
  receive: (state: PartyState) => void; // take in what the server said (also used by tests)
  poke: () => void; // ask for news right now
  suspend: () => void; // stop asking (the page was left); you are still in the party and are found again on return
  dismiss: () => void;
  clearMessage: () => void;
  settled: (key: number) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;
let floatKey = 0;
let chatUntil = 0; // listen closely until this moment: someone is talking

const wording = (error: unknown) => (error instanceof Error && error.message ? error.message : "Something went wrong");

export const usePartyStore = create<PartyStore>((set, get) => {
  const stop = () => {
    clearTimeout(timer);
    controller?.abort();
    controller = undefined;
  };

  const floats = (reactions: Reaction[]) => reactions.map((r) => ({ key: ++floatKey, emoji: r.emoji, name: r.name, mine: r.mine }));

  const apply = (state: PartyState) => {
    const fresh = state.reactions.filter((r) => !r.mine); // yours were already shown the moment you pressed
    const talking = hasMessage(state.chat);
    if (talking) chatUntil = Date.now() + CHAT_WINDOW_MS;
    set((s) => ({ status: "active", party: shareState(s.party, { ...state, reactions: [], chat: [] }), messages: mergeChat(s.messages, state.chat), online: true, floating: [...s.floating, ...floats(fresh)].slice(-MAX_FLOATING) }));
  };

  // only reactions arrived: nothing else is touched, so nothing else is redrawn
  const reactionsOnly = (news: { rseq: number; cn: number; reactions: Reaction[]; chat: ChatEvent[] }) => {
    if (hasMessage(news.chat)) chatUntil = Date.now() + CHAT_WINDOW_MS;
    set((s) => (s.party ? { party: { ...s.party, rseq: news.rseq, cn: news.cn }, messages: mergeChat(s.messages, news.chat), online: true, floating: [...s.floating, ...floats(news.reactions.filter((r) => !r.mine))].slice(-MAX_FLOATING) } : s));
  };

  // the music that came with the party stops with it
  const hush = () => useRadioStore.getState().status === "playing" && useRadioStore.getState().pause();

  const gone = (message: string) => {
    stop();
    hush();
    set({ status: "ended", party: null, message, floating: [], messages: [], online: true });
  };

  const refresh = async () => {
    const current = get().party;
    if (!current) return;
    stop();
    controller = new AbortController();
    const { signal } = controller;
    let offline = false;
    try {
      const news = await party.pollParty(current.id, current.seq, current.rseq, current.cn, signal);
      if (signal.aborted) return;
      if ("ended" in news) return gone("The party has ended.");
      if ("unchanged" in news) set({ online: true });
      else if ("partial" in news) reactionsOnly(news);
      else apply(news);
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof ApiError && error.status === 404) return gone("You are no longer in that party.");
      if (error instanceof ApiError && error.status === 401) return stop();
      set({ online: false });
      offline = true;
    }
    // how soon to ask again is decided AFTER the answer, so the poll that finds the first message already listens closely for the next
    const now = get().party?.now;
    const wait = offline ? OFFLINE_MS : document.hidden ? HIDDEN_MS : Date.now() < chatUntil ? CHAT_MS : now && now.kind !== "station" ? VIDEO_MS : POLL_MS;
    if (get().party?.id === current.id) timer = setTimeout(refresh, wait);
  };

  const begin = (state: PartyState) => {
    set({ messages: [] });
    chatUntil = 0;
    apply({ ...state, reactions: [] });
    set({ message: null });
    stop();
    timer = setTimeout(refresh, POLL_MS);
  };

  return {
    status: "none",
    party: null,
    message: null,
    online: true,
    floating: [],
    messages: [],

    restore: async () => {
      if (get().status === "active" || get().status === "loading") return;
      set({ status: "loading" });
      try {
        const found = await party.myParty();
        if (found) begin(found);
        else set({ status: "none" });
      } catch {
        set({ status: "none" });
      }
    },

    start: async (name) => {
      try {
        begin(await party.createParty(name));
        return true;
      } catch (error) {
        set({ message: wording(error) });
        return false;
      }
    },

    join: async (code) => {
      try {
        begin(await party.joinParty(code));
        return true;
      } catch (error) {
        set({ message: wording(error) });
        return false;
      }
    },

    leave: async () => {
      const current = get().party;
      if (!current) return;
      stop();
      hush();
      set({ status: "none", party: null, floating: [], messages: [], message: null });
      await party.leaveParty(current.id).catch(() => {});
    },

    end: async () => {
      const current = get().party;
      if (!current) return;
      stop();
      hush();
      set({ status: "none", party: null, floating: [], messages: [], message: null });
      await party.endParty(current.id).catch(() => {});
    },

    act: async (call) => {
      const current = get().party;
      if (!current) return false;
      try {
        await call(current.id);
        void refresh();
        return true;
      } catch (error) {
        set({ message: wording(error) });
        if (error instanceof ApiError && error.status === 404) void refresh(); // it may be gone, or the item already taken care of
        return false;
      }
    },

    say: async (text) => {
      chatUntil = Date.now() + CHAT_WINDOW_MS; // and listen closely for the answers
      return get().act((id) => party.sendChat(id, text));
    },

    react: (emoji) => {
      const current = get().party;
      if (!current) return;
      set((s) => ({ floating: [...s.floating, { key: ++floatKey, emoji, name: "You", mine: true }].slice(-MAX_FLOATING) }));
      void party.sendReaction(current.id, emoji).catch((error) => set({ message: wording(error) }));
    },

    receive: (state) => apply(state),
    poke: () => void refresh(),
    suspend: () => {
      stop();
      set({ status: "none", party: null, floating: [], messages: [], message: null });
    },
    dismiss: () => set({ status: "none", message: null }),
    clearMessage: () => set({ message: null }),
    settled: (key) => set((s) => ({ floating: s.floating.filter((f) => f.key !== key) })),
  };
});

// A tab that was in the background asks again the moment you come back.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) usePartyStore.getState().poke();
  });
}
