"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import BasicIcon from "@/app/components/ultis/icons";
import { MAX_PLAYLISTS, parsePlaylistId, type Playlist } from "@/app/utils/radio/radioData";
import { useEscape } from "./useEscape";

// The YouTube side of the radio: paste a playlist link from YouTube or YouTube Music, keep the ones you like.

interface Props {
  playlists: Playlist[];
  activeId: string | null;
  onPlay: (playlist: Playlist) => void;
  onAdd: (playlist: Playlist) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

function PlaylistPanel({ playlists, activeId, onPlay, onAdd, onRemove, onClose }: Props) {
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  useEscape(onClose);
  useEffect(() => {
    linkRef.current?.focus();
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = parsePlaylistId(link);
    if (!id) return setMessage("That doesn't look like a YouTube or YouTube Music playlist link.");
    if (!playlists.some((p) => p.id === id) && playlists.length >= MAX_PLAYLISTS) return setMessage(`You can keep ${MAX_PLAYLISTS} playlists. Remove one first.`);
    const playlist = { id, label: name.trim().slice(0, 40) || playlists.find((p) => p.id === id)?.label || "My playlist" };
    onAdd(playlist);
    onPlay(playlist);
    setLink("");
    setName("");
    setMessage(null);
  };

  return (
    <div className="radioPanel">
      <div className="radioPanel__top">
        <h3 className="radioPanel__title">YouTube playlists</h3>
        <button type="button" className="radioPanel__close" onClick={onClose} aria-label="Close the playlist guide">
          <BasicIcon icon="Cancel01Icon" size={18} />
        </button>
      </div>

      <form className="radioPanel__form" onSubmit={submit}>
        <label>
          <span className="sr-only">Playlist link</span>
          <input ref={linkRef} type="text" value={link} maxLength={300} placeholder="Paste a YouTube or YouTube Music playlist link" onChange={(event) => setLink(event.target.value)} aria-invalid={message ? true : undefined} />
        </label>
        <div className="radioPanel__formRow">
          <label>
            <span className="sr-only">Name (optional)</span>
            <input type="text" value={name} maxLength={40} placeholder="Name it (optional)" onChange={(event) => setName(event.target.value)} />
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
        {playlists.length === 0 && <p className="radioPanel__note">Your saved playlists show up here. Paste a link above to start.</p>}
        <ul>
          {playlists.map((playlist) => (
            <li key={playlist.id} className={`stationRow ${activeId === playlist.id ? "is-current" : ""}`}>
              <button type="button" className="stationRow__main" onClick={() => onPlay(playlist)} aria-current={activeId === playlist.id ? "true" : undefined}>
                <span className="stationRow__name">{playlist.label}</span>
                <span className="stationRow__meta">YouTube playlist</span>
              </button>
              <button type="button" className="stationRow__icon" onClick={() => onRemove(playlist.id)} aria-label={`Remove ${playlist.label}`} title="Remove">
                <BasicIcon icon="Cancel01Icon" size={16} />
              </button>
            </li>
          ))}
        </ul>
        <p className="radioPanel__fine">Plays through YouTube&apos;s own player, so some playlists (like auto-made mixes) may not allow it.</p>
      </div>
    </div>
  );
}

export default memo(PlaylistPanel);
