import { createLocalStore } from "@/app/utils/localStore";
import { sanitizePlaylists, type Playlist } from "./radioData";

// What you played from the YouTube guide lately (playlists and songs), newest first. Kept in this browser only: it is a convenience, not
// part of your account, so it is gone if you clear the browser's data.
export const MAX_HISTORY = 15;

export const historyStore = createLocalStore<Playlist[]>("personalhub:radio:youtube-history", (raw) => sanitizePlaylists(raw, MAX_HISTORY), []);

export const withHistory = (list: Playlist[], entry: Playlist): Playlist[] => [entry, ...list.filter((p) => p.id !== entry.id)].slice(0, MAX_HISTORY);
