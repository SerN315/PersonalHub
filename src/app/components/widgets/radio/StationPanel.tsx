"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import BasicIcon from "@/app/components/ultis/icons";
import { getNowPlaying, searchStations, type Station, type StationQuery } from "@/app/apis/radio";
import { useEscape } from "./useEscape";

// The pull-out station guide: type to search, tap a topic, or pick from your favourites.

interface Chip {
  key: string;
  label: string;
  query?: StationQuery; // undefined = a local list rather than a search
}

const CHIPS: Chip[] = [
  { key: "popular", label: "Popular", query: {} },
  { key: "favorites", label: "Favorites" },
  { key: "lofi", label: "Lo-fi", query: { tag: "lofi" } },
  { key: "chill", label: "Chill", query: { tag: "chillout" } },
  { key: "jazz", label: "Jazz", query: { tag: "jazz" } },
  { key: "classical", label: "Classical", query: { tag: "classical" } },
  { key: "news", label: "News", query: { tag: "news" } },
  { key: "pop", label: "Pop", query: { tag: "pop" } },
  { key: "rock", label: "Rock", query: { tag: "rock" } },
  { key: "vn", label: "Vietnam", query: { country: "VN" } },
  { key: "jp", label: "Japan", query: { country: "JP" } },
  { key: "kr", label: "Korea", query: { country: "KR" } },
  { key: "us", label: "USA", query: { country: "US" } },
];

interface Props {
  current: Station | null;
  playing: boolean;
  currentTitle: string | null;
  favorites: Station[];
  onResults: (stations: Station[]) => void; // the list shown becomes the list the tuning knob walks through
  onPlay: (station: Station) => void;
  onToggleFavorite: (station: Station) => void;
  onClose: () => void;
}

function StationPanel({ current, playing, currentTitle, favorites, onResults, onPlay, onToggleFavorite, onClose }: Props) {
  const [text, setText] = useState("");
  const [chip, setChip] = useState("popular");
  const [list, setList] = useState<Station[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [peeks, setPeeks] = useState<Record<string, string | null | "…">>({});
  const searchRef = useRef<HTMLInputElement>(null);
  useEscape(onClose);
  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  });

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Search as you type (after a short pause), and whenever a topic is tapped. A newer search cancels the older one.
  useEffect(() => {
    const active = CHIPS.find((c) => c.key === chip);
    if (chip === "favorites") return; // shown straight from the favourites list below
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setState("loading");
        try {
          const found = await searchStations({ ...(active?.query ?? {}), q: text }, controller.signal);
          setList(found);
          setState("ready");
          onResultsRef.current(found);
        } catch (error) {
          if (controller.signal.aborted) return;
          setState("error");
          void error;
        }
      },
      text ? 300 : 0
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, chip]);

  const shown = chip === "favorites" ? favorites.filter((s) => !text || `${s.name} ${s.country} ${s.tags.join(" ")}`.toLowerCase().includes(text.toLowerCase())) : list;
  const isFavorite = (station: Station) => favorites.some((f) => f.id === station.id);

  const peek = async (station: Station) => {
    setPeeks((prev) => ({ ...prev, [station.id]: "…" }));
    try {
      const song = await getNowPlaying(station.id);
      setPeeks((prev) => ({ ...prev, [station.id]: song }));
    } catch {
      setPeeks((prev) => ({ ...prev, [station.id]: null }));
    }
  };

  return (
    <div className="radioPanel">
      <div className="radioPanel__top">
        <label className="radioPanel__search">
          <BasicIcon icon="Search01Icon" size={18} />
          <span className="sr-only">Search stations</span>
          <input ref={searchRef} type="search" value={text} maxLength={60} placeholder="Type a station, genre or country…" onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="button" className="radioPanel__close" onClick={onClose} aria-label="Close the station guide">
          <BasicIcon icon="Cancel01Icon" size={18} />
        </button>
      </div>

      <div className="radioPanel__chips" role="group" aria-label="Topics">
        {CHIPS.map((c) => (
          <button key={c.key} type="button" className="chip" aria-pressed={chip === c.key} onClick={() => setChip(c.key)}>
            {c.key === "favorites" ? `★ ${c.label}${favorites.length ? ` (${favorites.length})` : ""}` : c.label}
          </button>
        ))}
      </div>

      <div className="radioPanel__list" aria-busy={state === "loading" && chip !== "favorites"}>
        {chip !== "favorites" && state === "loading" && <p className="radioPanel__note">Scanning the dial…</p>}
        {chip !== "favorites" && state === "error" && <p className="radioPanel__note">The station guide isn&apos;t answering. Try again in a moment.</p>}
        {(chip === "favorites" || state === "ready") && shown.length === 0 && (
          <p className="radioPanel__note">{chip === "favorites" ? "No favorites yet. Press the star on a station you like." : "No stations found. Try another word."}</p>
        )}
        <ul>
          {shown.map((station) => {
            const isCurrent = current?.id === station.id;
            const now = isCurrent ? currentTitle : peeks[station.id];
            return (
              <li key={station.id} className={`stationRow ${isCurrent ? "is-current" : ""}`}>
                <button type="button" className="stationRow__main" onClick={() => onPlay(station)} aria-current={isCurrent ? "true" : undefined}>
                  <span className="stationRow__name">
                    {station.name}
                    {isCurrent && playing && (
                      <span className="eq" aria-hidden>
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </span>
                  <span className="stationRow__meta">{[station.country, station.tags.slice(0, 2).join(" · "), station.bitrate ? `${station.bitrate} kbps` : ""].filter(Boolean).join(" · ")}</span>
                  {now === "…" && <span className="stationRow__now">Listening in…</span>}
                  {now && now !== "…" && (
                    <span className="stationRow__now">
                      <BasicIcon icon="MusicNote01Icon" size={12} /> {now}
                    </span>
                  )}
                  {now === null && !isCurrent && station.id in peeks && <span className="stationRow__now is-quiet">No song info from this station</span>}
                </button>
                {!isCurrent && (
                  <button type="button" className="stationRow__icon" onClick={() => peek(station)} aria-label={`What is playing on ${station.name}`} title="What's on?">
                    <BasicIcon icon="MusicNote01Icon" size={16} />
                  </button>
                )}
                <button type="button" className="stationRow__icon stationRow__star" aria-pressed={isFavorite(station)} onClick={() => onToggleFavorite(station)} aria-label={isFavorite(station) ? `Remove ${station.name} from favorites` : `Add ${station.name} to favorites`} title="Favorite">
                  <BasicIcon icon="StarIcon" size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default memo(StationPanel);
