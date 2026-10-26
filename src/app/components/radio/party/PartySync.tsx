"use client";
import { memo, useEffect, useRef } from "react";
import { usePartyStore } from "@/app/utils/party/store";
import { useRadioStore } from "@/app/utils/radio/engine";
import type { Station } from "@/app/apis/radio";
import type { PartySong } from "@/app/apis/party";

// Keeps this page's radio in step with the party: when the host tunes a station, so does this page; when the host moves to a video (which has
// its own window) or to silence, the radio stops. It does nothing else and draws nothing.

// the stream address always comes from the server's own directory lookup
export const stationOf = (song: PartySong): Station | null =>
  song.kind === "station" && song.url ? { id: song.ref, name: song.name ?? "Radio", url: song.url, country: "", countryCode: "", tags: [], codec: "", bitrate: 0, votes: 0 } : null;

function PartySync() {
  const now = usePartyStore((s) => s.party?.now ?? null);
  const applied = useRef<string | null>(null);

  useEffect(() => {
    const key = now ? `${now.kind}:${now.ref}:${now.startedMs}` : "silence";
    if (applied.current === key) return;
    applied.current = key;
    const engine = useRadioStore.getState();
    const station = now ? stationOf(now) : null;
    if (station) {
      const same = engine.station?.id === station.id && (engine.status === "playing" || engine.status === "loading");
      if (!same) engine.tune(station);
    } else {
      engine.pause();
    }
  }, [now]);

  return null;
}

export default memo(PartySync);
