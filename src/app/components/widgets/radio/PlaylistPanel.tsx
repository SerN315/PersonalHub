"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import BasicIcon from "@/app/components/ultis/icons";
import { getYouTubeName, type YouTubeName } from "@/app/apis/radio";
import { MAX_PLAYLISTS, isVideo, needsName, parsePlaylistId, parseYouTubeLink, playlistName, titleWithAuthor, type Playlist } from "@/app/utils/radio/radioData";
import { historyStore, withHistory } from "@/app/utils/radio/youtubeHistory";
import { useEscape } from "./useEscape";

// The YouTube side of the radio: paste a link to a playlist or a single song (YouTube or YouTube Music) and keep the ones you like.
// Nothing needs naming: the title and channel are looked up. Typing a name still wins.

interface Props {
  playlists: Playlist[];
  activeId: string | null;
  onPlay: (playlist: Playlist) => void;
  onAdd: (playlist: Playlist) => void;
  onUpdate: (id: string, patch: Pick<Playlist, "title" | "author">) => void; // fills in a name that was found later
  onRemove: (id: string) => void;
  onClose: () => void;
}

type Found = { kind: "playlist" | "video"; id: string };
// A link to a playlist means the playlist (even when it also names a video in it); otherwise it is a single song.
const detect = (link: string): Found | null => {
  const list = parsePlaylistId(link);
  if (list && !/^[A-Za-z0-9_-]{11}$/.test(link.trim())) return { kind: "playlist", id: list };
  const found = parseYouTubeLink(link);
  return found ? { kind: found.kind, id: found.ref } : null;
};

function PlaylistPanel({ playlists, activeId, onPlay, onAdd, onUpdate, onRemove, onClose }: Props) {
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ key: string; name: YouTubeName | null } | null>(null); // what YouTube calls the pasted link
  const linkRef = useRef<HTMLInputElement>(null);
  const asked = useRef(new Set<string>()); // saved ones already looked up, so each is asked about once
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });
  const history = historyStore.use();
  useEscape(onClose);
  useEffect(() => {
    linkRef.current?.focus();
  }, []);

  const found = detect(link);
  const foundKey = found ? `${found.kind}:${found.id}` : null;

  // as soon as a good link is pasted, look up its name (a moment after typing stops)
  useEffect(() => {
    if (!found) return;
    const controller = new AbortController();
    const key = `${found.kind}:${found.id}`;
    const timer = setTimeout(() => {
      getYouTubeName(found.kind, found.id, controller.signal)
        .then((result) => setPreview({ key, name: result }))
        .catch(() => !controller.signal.aborted && setPreview({ key, name: null }));
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundKey]);

  // saved ones from before names were looked up get theirs now
  useEffect(() => {
    for (const item of playlists) {
      const key = `${item.kind ?? "playlist"}:${item.id}`;
      if (!needsName(item) || asked.current.has(key)) continue;
      asked.current.add(key);
      getYouTubeName(isVideo(item) ? "video" : "playlist", item.id)
        .then((result) => result.title && onUpdateRef.current(item.id, { title: result.title, author: result.author ?? undefined }))
        .catch(() => {});
    }
  }, [playlists]);

  const looked = found && preview?.key === foundKey ? preview : null;

  // everything played is remembered in this browser, so it can be played again without finding the link
  const play = (entry: Playlist) => {
    historyStore.set(withHistory(historyStore.get(), entry));
    onPlay(entry);
  };
  const recent = history.filter((h) => !playlists.some((p) => p.id === h.id));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!found) return setMessage("That doesn't look like a YouTube or YouTube Music link to a playlist or a song.");
    if (!playlists.some((p) => p.id === found.id) && playlists.length >= MAX_PLAYLISTS) return setMessage(`You can keep ${MAX_PLAYLISTS}. Remove one first.`);
    const before = playlists.find((p) => p.id === found.id);
    const result = looked?.name;
    const entry: Playlist = {
      id: found.id,
      label: name.trim().slice(0, 40) || before?.label || "",
      ...(found.kind === "video" ? { kind: "video" as const } : {}),
      ...((result?.title ?? before?.title) ? { title: result?.title ?? before?.title, ...((result?.author ?? before?.author) ? { author: result?.author ?? before?.author } : {}) } : {}),
    };
    onAdd(entry);
    play(entry);
    setLink("");
    setName("");
    setPreview(null);
    setMessage(null);
  };

  return (
    <div className="radioPanel">
      <div className="radioPanel__top">
        <h3 className="radioPanel__title">YouTube</h3>
        <button type="button" className="radioPanel__close" onClick={onClose} aria-label="Close the YouTube guide">
          <BasicIcon icon="Cancel01Icon" size={18} />
        </button>
      </div>

      <form className="radioPanel__form" onSubmit={submit}>
        <label>
          <span className="sr-only">Playlist or song link</span>
          <input ref={linkRef} type="text" value={link} maxLength={300} placeholder="Paste a playlist or song link (YouTube or YouTube Music)" onChange={(event) => { setLink(event.target.value); setMessage(null); }} aria-invalid={message ? true : undefined} />
        </label>
        {found && (
          <p className="radioPanel__found" role="status">
            <BasicIcon icon={found.kind === "video" ? "MusicNote01Icon" : "PlayListIcon"} size={14} />{" "}
            {found.kind === "video" ? "A song" : "A playlist"}
            {looked ? (looked.name?.title ? `: ${titleWithAuthor(looked.name.title, looked.name.author)}` : ". Couldn't find its name, but it can still play.") : ". Looking up the name…"}
          </p>
        )}
        <div className="radioPanel__formRow">
          <label>
            <span className="sr-only">Name (optional)</span>
            <input type="text" value={name} maxLength={40} placeholder={looked?.name?.title ? "Rename it (optional)" : "Name it (optional)"} onChange={(event) => setName(event.target.value)} />
          </label>
          <button type="submit" className="radioPanel__go">
            <BasicIcon icon="PlayIcon" size={16} /> Play
          </button>
        </div>
        {message && (
          <p className="radioPanel__error" role="alert">
            {message}
          </p>
        )}
      </form>

      <div className="radioPanel__list">
        {playlists.length === 0 && <p className="radioPanel__note">Your saved playlists and songs show up here. Paste a link above to start.</p>}
        <ul>
          {playlists.map((playlist) => (
            <li key={playlist.id} className={`stationRow ${activeId === playlist.id ? "is-current" : ""}`}>
              <button type="button" className="stationRow__main" onClick={() => play(playlist)} aria-current={activeId === playlist.id ? "true" : undefined}>
                <span className="stationRow__name">{playlistName(playlist)}</span>
                <span className="stationRow__meta">{isVideo(playlist) ? "YouTube song" : "YouTube playlist"}{playlist.label && playlist.title ? ` · ${titleWithAuthor(playlist.title, playlist.author)}` : ""}</span>
              </button>
              <button type="button" className="stationRow__icon" onClick={() => onRemove(playlist.id)} aria-label={`Remove ${playlistName(playlist)}`} title="Remove">
                <BasicIcon icon="Cancel01Icon" size={16} />
              </button>
            </li>
          ))}
        </ul>
        {recent.length > 0 && (
          <>
            <div className="radioPanel__sub">
              <h4>Recent</h4>
              <button type="button" className="radioPanel__link" onClick={() => historyStore.set([])}>
                Clear history
              </button>
            </div>
            <ul>
              {recent.map((item) => (
                <li key={item.id} className={`stationRow ${activeId === item.id ? "is-current" : ""}`}>
                  <button type="button" className="stationRow__main" onClick={() => play(item)}>
                    <span className="stationRow__name">{playlistName(item)}</span>
                    <span className="stationRow__meta">{isVideo(item) ? "YouTube song" : "YouTube playlist"} · played lately</span>
                  </button>
                  <button type="button" className="stationRow__icon" onClick={() => playlists.length < MAX_PLAYLISTS ? onAdd(item) : setMessage(`You can keep ${MAX_PLAYLISTS}. Remove one first.`)} aria-label={`Save ${playlistName(item)}`} title="Save to my list">
                    <BasicIcon icon="StarIcon" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="radioPanel__fine">Plays through YouTube&apos;s own player, so some (like auto-made mixes or private lists) may not allow it. Saving a link again with a name renames it. Recent is remembered in this browser only.</p>
      </div>
    </div>
  );
}

export default memo(PlaylistPanel);
