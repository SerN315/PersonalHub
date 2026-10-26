import type { Station } from "@/app/apis/radio";
import { createLocalStore } from "@/app/utils/localStore";
import { sanitizeStation } from "./radioData";

// The stations you listened to lately, kept in this browser only (newest first).
export const MAX_RECENT = 8;

export const recentStore = createLocalStore<Station[]>(
  "personalhub:radio:recent",
  (raw) => {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: Station[] = [];
    for (const item of raw) {
      const station = sanitizeStation(item);
      if (station && !seen.has(station.id)) {
        seen.add(station.id);
        out.push(station);
      }
      if (out.length >= MAX_RECENT) break;
    }
    return out;
  },
  [],
);

export const withRecent = (list: Station[], station: Station) => [station, ...list.filter((s) => s.id !== station.id)].slice(0, MAX_RECENT);
