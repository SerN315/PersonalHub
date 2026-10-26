"use client";
import { memo, useEffect, useState } from "react";
import { getPlaylistSongs, type PlaylistSong } from "@/app/apis/radio";
import { titleWithAuthor } from "@/app/utils/radio/radioData";

// The songs inside a playlist that is waiting in the line-up (opened from its drop-down). Looked up on the server and remembered while the
// page is open. Some playlists cannot be listed (private ones, or the owner has not set up a YouTube key); then it says so and the playlist still plays.

const known = new Map<string, PlaylistSong[] | null>();

function PlaylistSongs({ id }: { id: string }) {
  const [, refresh] = useState(0);
  useEffect(() => {
    if (known.has(id)) return;
    let cancelled = false;
    getPlaylistSongs(id)
      .then((songs) => known.set(id, songs))
      .catch(() => known.set(id, null))
      .finally(() => !cancelled && refresh((n) => n + 1));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!known.has(id)) return <p className="songs__note">Looking up the songs…</p>;
  const songs = known.get(id);
  if (!songs) return <p className="songs__note">The songs in this playlist cannot be listed (it may be private, or the owner has not switched listing on). It will still play.</p>;
  if (songs.length === 0) return <p className="songs__note">This playlist looks empty.</p>;
  return (
    <ol className="songs">
      {songs.map((song, i) => (
        <li key={`${song.id}-${i}`}>
          <span className="songs__n">{i + 1}</span>
          <span className="songs__t">{titleWithAuthor(song.title, song.author)}</span>
        </li>
      ))}
      {songs.length >= 100 && <li className="songs__more">…and more (the first 100 are shown)</li>}
    </ol>
  );
}

export default memo(PlaylistSongs);
