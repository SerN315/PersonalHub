import { api } from "./http";

// Radio parties (listen together). The server decides who may do what; this file only describes what it says.

export type SongKind = "station" | "video" | "playlist";

export interface PartySong {
  kind: SongKind;
  ref: string; // the station's id in the directory, or a YouTube video / playlist id
  title: string | null;
  name: string | null; // a station's name
  url: string | null; // a station's stream, as the server found it in the directory
  posMs: number; // where the host was in a video, as of posAtMs
  playing: boolean; // the host's video is playing (false: paused)
  index: number; // the track of a playlist the host is on
  posAtMs: number | null; // server time of that
  startedMs: number | null;
}

export interface PartyMember {
  id: string;
  name: string;
  host: boolean;
}

export interface QueueItem {
  id: string;
  status: "pending" | "queued";
  kind: "station" | "video";
  ref: string;
  title: string | null;
  name: string | null;
  url: string | null;
  by: string;
  mine: boolean;
}

export interface Reaction {
  n: number;
  emoji: string;
  name: string;
  mine: boolean;
}

export interface PartyState {
  id: string;
  name: string;
  code?: string; // only the host is given it
  isHost: boolean;
  me: string;
  seq: number;
  serverMs: number;
  now: PartySong | null;
  members: PartyMember[];
  queue: QueueItem[];
  rseq: number;
  reactions: Reaction[];
}

export type Poll = PartyState | { unchanged: true; seq: number; rseq: number } | { ended: true };

export const EMOJIS = ["❤️", "🔥", "👏", "😂", "🎶", "😴"];

export interface Pick {
  kind: SongKind;
  ref: string;
  title?: string;
}

const base = (id: string) => `/api/party/${id}`;
const ok = { method: "POST" } as const;

export const createParty = (name: string) => api<PartyState>("/api/party", { method: "POST", body: name.trim() ? { name: name.trim() } : {} });
export const joinParty = (code: string) => api<PartyState>("/api/party/join", { method: "POST", body: { code } });
export const myParty = () => api<{ party: PartyState | null }>("/api/party/mine").then((r) => r.party);
export const pollParty = (id: string, seq: number, rseq: number, signal?: AbortSignal) => api<Poll>(`${base(id)}?seq=${seq}&rseq=${rseq}`, { signal });

export const leaveParty = (id: string) => api(`${base(id)}/leave`, ok);
export const endParty = (id: string) => api(base(id), { method: "DELETE" });
export const playNow = (id: string, pick: Pick) => api(`${base(id)}/now`, { method: "POST", body: pick });
export const sendPosition = (id: string, where: { posMs: number; playing?: boolean; index?: number }) => api(`${base(id)}/position`, { method: "POST", body: { ...where, posMs: Math.round(where.posMs) } });
export const skipSong = (id: string) => api(`${base(id)}/skip`, ok);
export const kickMember = (id: string, member: string) => api(`${base(id)}/kick/${member}`, ok);
export const suggestSong = (id: string, pick: Pick) => api(`${base(id)}/queue`, { method: "POST", body: pick });
export const approveItem = (id: string, item: string) => api(`${base(id)}/queue/${item}/approve`, ok);
export const playItem = (id: string, item: string) => api(`${base(id)}/queue/${item}/play`, ok);
export const removeItem = (id: string, item: string) => api(`${base(id)}/queue/${item}`, { method: "DELETE" });
export const sendReaction = (id: string, emoji: string) => api(`${base(id)}/react`, { method: "POST", body: { emoji } });
