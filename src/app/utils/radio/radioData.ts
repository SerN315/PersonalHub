import type { Station } from "@/app/apis/radio";

// Pure helpers for the radio widget (no React, no browser), so they can be tested on their own.

export const MAX_FAVORITES = 30; // the saved data must stay small: the backend caps a widget's data at 20 kB
export const MAX_PLAYLISTS = 10;

export interface Playlist {
  id: string; // YouTube's playlist id
  label: string;
}

// ---- YouTube links -------------------------------------------------------------------------------------------------

const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);

// Accepts a playlist link from YouTube or YouTube Music (playlist page, a video inside a playlist, a short link) or a bare
// playlist id, and returns the id. Anything else (other sites, javascript: links, plain text) is rejected.
export function parsePlaylistId(input: string): string | null {
  const text = input.trim();
  if (!text || text.length > 300) return null;
  if (PLAYLIST_ID.test(text)) return text;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const list = url.searchParams.get("list");
  return list && PLAYLIST_ID.test(list) ? list : null;
}

// ---- restoring saved data (it comes back from the server as untrusted JSON) -----------------------------------------

const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

export function sanitizeStation(value: unknown): Station | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = text(raw.id, 36);
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  const name = text(raw.name, 80);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^https:\/\/[^\s]+$/i.test(url) || url.length > 500 || !name) return null;
  return {
    id: id.toLowerCase(),
    name,
    url,
    country: text(raw.country, 40),
    countryCode: /^[A-Z]{2}$/.test(String(raw.countryCode ?? "")) ? String(raw.countryCode) : "",
    tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => text(tag, 24)).filter(Boolean).slice(0, 4) : [],
    codec: text(raw.codec, 12),
    bitrate: Number.isFinite(Number(raw.bitrate)) ? Math.max(0, Math.min(1000, Math.round(Number(raw.bitrate)))) : 0,
    votes: 0,
  };
}

export function sanitizeFavorites(value: unknown): Station[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: Station[] = [];
  for (const item of value) {
    const station = sanitizeStation(item);
    if (station && !seen.has(station.id)) {
      seen.add(station.id);
      out.push(station);
    }
    if (out.length >= MAX_FAVORITES) break;
  }
  return out;
}

export function sanitizePlaylists(value: unknown): Playlist[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: Playlist[] = [];
  for (const item of value) {
    const raw = (item ?? {}) as Record<string, unknown>;
    const id = typeof raw.id === "string" && PLAYLIST_ID.test(raw.id) ? raw.id : null;
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push({ id, label: text(raw.label, 40) || "My playlist" });
    }
    if (out.length >= MAX_PLAYLISTS) break;
  }
  return out;
}

// ---- favourites and the dial ---------------------------------------------------------------------------------------

export function toggleFavorite(favorites: Station[], station: Station): Station[] {
  if (favorites.some((s) => s.id === station.id)) return favorites.filter((s) => s.id !== station.id);
  return [...favorites, station].slice(-MAX_FAVORITES); // the oldest makes room for the newest
}

// Where a station sits on the dial (0 = far left, 1 = far right). With one or no stations there is nothing to turn.
export function positionFor(index: number, count: number) {
  return count > 1 && index >= 0 ? index / (count - 1) : 0;
}

// Which station the knob is pointing at.
export function indexFor(position: number, count: number) {
  return count > 0 ? Math.min(count - 1, Math.max(0, Math.round(position * (count - 1)))) : -1;
}

// Next/previous with wrap-around; from "nothing selected" the first press goes to the first or last station.
export function stepIndex(count: number, current: number, delta: 1 | -1) {
  if (count === 0) return -1;
  if (current < 0) return delta > 0 ? 0 : count - 1;
  return (current + delta + count) % count;
}

// The number printed on the dial for a position: a vintage FM scale (88-108). Only a scale, not a claim about the station.
export function dialNumber(position: number) {
  return (88 + Math.min(1, Math.max(0, position)) * 20).toFixed(1);
}
