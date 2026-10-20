"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import BaseWidget from "../BaseWidget";
import BasicIcon from "@/app/components/ultis/icons";
import Knob from "./Knob";
import StationPanel from "./StationPanel";
import PlaylistPanel from "./PlaylistPanel";
import YouTubePlayer, { type YouTubeHandle, type YouTubeInfo } from "./YouTubePlayer";
import WidgetProps from "@/app/types/widget";
import { searchStations, type Station } from "@/app/apis/radio";
import { useRadioStore } from "@/app/utils/radio/engine";
import { dialNumber, indexFor, positionFor, sanitizeFavorites, sanitizePlaylists, sanitizeStation, stepIndex, toggleFavorite, type Playlist } from "@/app/utils/radio/radioData";
import "../../../styles/widgets/radio.scss";

type Source = "radio" | "youtube";

const SAVE_DELAY_MS = 800;
const TURN_DELAY_MS = 350; // turning the knob scrubs past stations; only the one it rests on is opened
// YouTube's player rules need it to be at least 200 x 200 and visible, so it only appears when the radio has the room.
const YOUTUBE_MIN = { width: 330, height: 430 };
const YT_IDLE: YouTubeInfo = { status: "idle", title: null, index: 0, count: 0, error: null };

// Long text scrolls past like a real tuner's display, but only when it does not fit.
function Marquee({ text, className }: { text: string; className?: string }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  useEffect(() => {
    const box = boxRef.current;
    const inner = textRef.current;
    if (!box || !inner) return;
    const measure = () => setShift(Math.max(0, inner.scrollWidth - box.clientWidth));
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text]);
  return (
    <span ref={boxRef} className={`marquee ${className ?? ""}`} title={text}>
      <span ref={textRef} className={`marquee__text ${shift > 0 ? "is-scrolling" : ""}`} style={{ ["--shift" as string]: `-${shift}px`, ["--dur" as string]: `${Math.max(6, shift / 18)}s` }}>
        {text}
      </span>
    </span>
  );
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setSize((prev) => (prev.w === element.clientWidth && prev.h === element.clientHeight ? prev : { w: element.clientWidth, h: element.clientHeight }));
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

function RadioWidget(props: WidgetProps) {
  const { data, onData } = props;
  const station = useRadioStore((s) => s.station);
  const status = useRadioStore((s) => s.status);
  const title = useRadioStore((s) => s.title);
  const volume = useRadioStore((s) => s.volume);
  const error = useRadioStore((s) => s.error);
  const engine = useRadioStore.getState;

  // What is saved with the widget (your account): source, favourites, playlists, last station, volume.
  const [initial] = useState(() => ({
    source: (data?.source === "youtube" ? "youtube" : "radio") as Source,
    favorites: sanitizeFavorites(data?.favorites),
    playlists: sanitizePlaylists(data?.playlists),
    activePlaylist: typeof data?.activePlaylist === "string" ? data.activePlaylist : null,
    volume: Math.round((typeof data?.volume === "number" ? Math.min(1, Math.max(0, data.volume)) : useRadioStore.getState().volume) * 100) / 100,
    lastStation: sanitizeStation(data?.lastStation),
  }));
  const [source, setSource] = useState<Source>(initial.source);
  const [favorites, setFavorites] = useState<Station[]>(initial.favorites);
  const [playlists, setPlaylists] = useState<Playlist[]>(initial.playlists);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(initial.activePlaylist);

  const [results, setResults] = useState<Station[]>([]); // what the guide last showed; the knob walks through it when there are no favorites
  const [panelOpen, setPanelOpen] = useState(false);
  const [yt, setYt] = useState<YouTubeInfo>(YT_IDLE);
  const [turning, setTurning] = useState<number | null>(null); // the knob's position while it is being turned
  const ytRef = useRef<YouTubeHandle>(null);
  const [ytAutoplay, setYtAutoplay] = useState(false); // true only when a person just asked for a playlist
  const turnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [cabinetRef, size] = useElementSize<HTMLDivElement>();

  // ---- restore the saved state once (without starting any sound) ---------------------------------------------------
  useEffect(() => {
    const { station: playing, status: current, select, setVolume } = engine();
    if (current === "idle" && !playing) setVolume(initial.volume);
    if (initial.lastStation && !playing) select(initial.lastStation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- save changes to the account, a moment after they stop -------------------------------------------------------
  const lastSaved = useRef(JSON.stringify(initial)); // what was loaded is already saved: only real changes are sent
  useEffect(() => {
    const current = { source, favorites, playlists, activePlaylist: activePlaylistId, volume: Math.round(volume * 100) / 100, lastStation: station };
    const snapshot = JSON.stringify(current);
    if (snapshot === lastSaved.current) return;
    const timer = setTimeout(() => {
      lastSaved.current = snapshot;
      onData?.(props.id, current);
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [source, favorites, playlists, activePlaylistId, volume, station, onData, props.id]);

  // ---- the dial ------------------------------------------------------------------------------------------------------
  const presets = favorites.length >= 2 ? favorites : results; // the stations the knob turns through
  const currentIndex = station ? presets.findIndex((s) => s.id === station.id) : -1;
  const radioPosition = positionFor(currentIndex, presets.length);

  const ensureResults = useCallback(async () => {
    if (results.length > 0) return results;
    try {
      const found = await searchStations({});
      setResults(found);
      return found;
    } catch {
      return [];
    }
  }, [results]);

  const tuneTo = useCallback((next: Station) => engine().tune(next), [engine]);

  const stepStation = useCallback(
    async (delta: 1 | -1) => {
      const list = presets.length > 0 ? presets : await ensureResults();
      const at = list.findIndex((s) => s.id === engine().station?.id);
      const index = stepIndex(list.length, at, delta);
      if (index >= 0) tuneTo(list[index]);
    },
    [presets, ensureResults, engine, tuneTo]
  );

  const turnTuning = (position: number) => {
    setTurning(position);
    clearTimeout(turnTimer.current);
    turnTimer.current = setTimeout(async () => {
      if (source === "radio") {
        const list = presets.length > 1 ? presets : await ensureResults();
        const index = indexFor(position, list.length);
        if (index >= 0 && list[index].id !== engine().station?.id) tuneTo(list[index]);
      } else if (yt.count > 0) {
        ytRef.current?.playAt(indexFor(position, yt.count));
      }
      setTurning(null);
    }, TURN_DELAY_MS);
  };
  useEffect(() => () => clearTimeout(turnTimer.current), []);

  // ---- source, play, keys --------------------------------------------------------------------------------------------
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) ?? null;
  const canYouTube = size.h >= YOUTUBE_MIN.height && size.w >= YOUTUBE_MIN.width;

  const chooseSource = (next: Source) => {
    if (next === source) return;
    setPanelOpen(false);
    if (next === "youtube") engine().pause();
    setSource(next);
    setYtAutoplay(false);
  };

  const playPlaylist = (playlist: Playlist) => {
    setYtAutoplay(true);
    setActivePlaylistId(playlist.id);
    setPanelOpen(false);
    if (source !== "youtube") chooseSource("youtube");
  };

  const onPlayPause = async () => {
    if (source === "youtube") {
      if (!activePlaylist) return setPanelOpen(true);
      return yt.status === "playing" ? ytRef.current?.pause() : ytRef.current?.play();
    }
    if (station) return engine().toggle();
    const list = await ensureResults();
    if (list.length > 0) tuneTo(list[0]);
    else setPanelOpen(true);
  };

  const playing = source === "radio" ? status === "playing" : yt.status === "playing";
  const isFavorite = !!station && favorites.some((f) => f.id === station.id);

  // ---- what the little display says ---------------------------------------------------------------------------------
  let line1: string;
  let line2: string;
  if (source === "radio") {
    line1 = station?.name ?? "No station tuned";
    line2 = status === "error" ? (error ?? "Can't play this station") : status === "loading" ? "Tuning…" : status === "playing" ? (title ?? "On air") : status === "paused" ? "Paused" : station ? "Press play" : "Open the guide or press play";
  } else if (!activePlaylist) {
    line1 = "YouTube";
    line2 = "Open the guide to add a playlist";
  } else {
    line1 = activePlaylist.label;
    line2 = !canYouTube ? "Make the radio bigger to play" : yt.error ?? (yt.status === "loading" ? "Loading…" : yt.title ?? (yt.status === "paused" ? "Paused" : "Press play"));
  }

  const tuningValue = turning ?? (source === "radio" ? radioPosition : positionFor(yt.index, yt.count));
  const tuningText = source === "radio" ? (station?.name ?? "No station") : `Track ${yt.index + 1} of ${yt.count || "?"}`;
  const nextRadio = () => (source === "radio" ? stepStation(1) : ytRef.current?.next());
  const previousRadio = () => (source === "radio" ? stepStation(-1) : ytRef.current?.previous());

  return (
    <BaseWidget title="Radio" {...props} tintable={false}>
      <div ref={cabinetRef} className={`radio ${playing ? "is-on" : ""} radio--${source}`} role="group" aria-label="Radio">
        {/* the dial window: the frequency scale for radio, YouTube's own player for playlists */}
        <div className="radio__window">
          {source === "radio" ? (
            <div className="dial" aria-hidden>
              <div className="dial__glass">
                <div className="dial__scale">
                  {[88, 92, 96, 100, 104, 108].map((n, i) => (
                    <span key={n} style={{ left: `${(i / 5) * 100}%` }}>
                      {n}
                    </span>
                  ))}
                </div>
                {presets.length > 1 && presets.length <= 30 && (
                  <div className="dial__stations">
                    {presets.map((s, i) => (
                      <i key={s.id} className={s.id === station?.id ? "is-here" : ""} style={{ left: `${positionFor(i, presets.length) * 100}%` }} />
                    ))}
                  </div>
                )}
                <div className="dial__needle" style={{ left: `${7 + tuningValue * 86}%` }} />
                <div className="dial__band">FM · {dialNumber(tuningValue)} MHz</div>
              </div>
            </div>
          ) : activePlaylist && canYouTube ? (
            <div className="ytWindow">
              <YouTubePlayer ref={ytRef} playlistId={activePlaylist.id} volume={volume} autoplay={ytAutoplay} onInfo={setYt} />
            </div>
          ) : (
            <div className="ytNotice">
              <BasicIcon icon="YoutubeIcon" size={26} strokeWidth={1.3} />
              <p>{activePlaylist ? "YouTube needs room to show its player." : "Play YouTube and YouTube Music playlists."}</p>
              <small>{activePlaylist ? "Make this radio bigger (about 5 wide and 4 tall) in Arrange mode." : "Open the guide to add one."}</small>
            </div>
          )}
        </div>

        <div className="radio__lcd" aria-live="polite">
          <span className={`lamp ${playing ? "is-lit" : ""}`} aria-hidden title="On air" />
          <div className="radio__lines">
            <Marquee text={line1} className="radio__line1" />
            <Marquee text={line2} className={`radio__line2 ${status === "error" && source === "radio" ? "is-error" : ""}`} />
          </div>
        </div>

        <div className="radio__grille" aria-hidden>
          <span>PersonalHub</span>
        </div>

        <div className="radio__controls">
          <Knob label="Volume" value={volume} onChange={(v) => engine().setVolume(v)} valueText={`${Math.round(volume * 100)} percent`} />
          <div className="transport">
            <button type="button" className="key key--round" onClick={previousRadio} aria-label={source === "radio" ? "Previous station" : "Previous track"}>
              <BasicIcon icon="PreviousIcon" size={18} />
            </button>
            <button type="button" className="key key--play" onClick={onPlayPause} aria-label={playing ? "Pause" : "Play"}>
              <BasicIcon icon={playing ? "PauseIcon" : "PlayIcon"} size={24} />
            </button>
            <button type="button" className="key key--round" onClick={nextRadio} aria-label={source === "radio" ? "Next station" : "Next track"}>
              <BasicIcon icon="NextIcon" size={18} />
            </button>
          </div>
          <Knob label={source === "radio" ? "Tuning" : "Track"} value={tuningValue} onChange={turnTuning} step={source === "radio" && presets.length > 1 ? 1 / (presets.length - 1) : 0.1} snaps={source === "radio" && presets.length > 1 ? presets.length : undefined} valueText={tuningText} />
        </div>

        <div className="radio__keys" role="group" aria-label="Source and guide">
          <button type="button" className="pkey" aria-pressed={source === "radio"} onClick={() => chooseSource("radio")}>
            <BasicIcon icon="Radio01Icon" size={14} /> Radio
          </button>
          <button type="button" className="pkey" aria-pressed={source === "youtube"} onClick={() => chooseSource("youtube")}>
            <BasicIcon icon="YoutubeIcon" size={14} /> YouTube
          </button>
          <button type="button" className="pkey" aria-pressed={panelOpen} onClick={() => setPanelOpen((open) => !open)}>
            <BasicIcon icon={source === "radio" ? "ListViewIcon" : "PlayListIcon"} size={14} /> {source === "radio" ? "Stations" : "Playlists"}
          </button>
          {source === "radio" && (
            <button type="button" className="pkey pkey--star" aria-pressed={isFavorite} disabled={!station} onClick={() => station && setFavorites((list) => toggleFavorite(list, station))} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
              <BasicIcon icon="StarIcon" size={14} />
            </button>
          )}
        </div>

        {panelOpen && source === "radio" && (
          <StationPanel
            current={station}
            playing={status === "playing"}
            currentTitle={title}
            favorites={favorites}
            onResults={setResults}
            onPlay={(next) => tuneTo(next)}
            onToggleFavorite={(next) => setFavorites((list) => toggleFavorite(list, next))}
            onClose={() => setPanelOpen(false)}
          />
        )}
        {panelOpen && source === "youtube" && (
          <PlaylistPanel
            playlists={playlists}
            activeId={activePlaylistId}
            onPlay={playPlaylist}
            onAdd={(playlist) => setPlaylists((list) => [...list.filter((p) => p.id !== playlist.id), playlist])}
            onRemove={(id) => {
              setPlaylists((list) => list.filter((p) => p.id !== id));
              if (activePlaylistId === id) setActivePlaylistId(null);
            }}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>
    </BaseWidget>
  );
}

export default memo(RadioWidget);
