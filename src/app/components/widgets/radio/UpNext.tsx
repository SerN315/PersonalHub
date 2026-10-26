"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import { getVideoNames, type YouTubeName } from "@/app/apis/radio";
import { titleWithAuthor } from "@/app/utils/radio/radioData";
import { useEscape } from "./useEscape";

// The drop-down under the radio's display: the song playing and the ones coming up, by name. The names come from YouTube (looked up a few at a
// time, and remembered), because the player itself only tells us the ids. Pressing a song plays it.

const STEP = 25;
const names = new Map<string, YouTubeName | null>(); // kept while the page is open, so reopening is instant

interface Props {
  ids: string[]; // the whole playlist, in order
  index: number; // the one playing
  onPlay: (index: number) => void;
  onClose: () => void;
  readOnly?: boolean; // shown but not pressable (a guest in a party follows the host)
  inline?: boolean; // part of the page rather than dropping down from the radio's display
}

function UpNext({ ids, index, onPlay, onClose, readOnly = false, inline = false }: Props) {
  const [shown, setShown] = useState(STEP); // how many, counting from the one playing
  const [, refresh] = useState(0);
  const [failed, setFailed] = useState(false);
  const current = useRef<HTMLLIElement>(null);
  const asking = useRef(new Set<string>());
  useEscape(onClose);

  const upcoming = ids.slice(index, index + shown);
  const wanted = upcoming.join(",");

  useEffect(() => {
    const missing = wanted.split(",").filter((id) => id && !names.has(id) && !asking.current.has(id));
    if (missing.length === 0) return;
    for (const id of missing) asking.current.add(id);
    let cancelled = false;
    for (let i = 0; i < missing.length; i += STEP) {
      const chunk = missing.slice(i, i + STEP);
      getVideoNames(chunk)
        .then((found) => {
          for (const id of chunk) names.set(id, found[id] ?? null);
          if (!cancelled) refresh((n) => n + 1);
        })
        .catch(() => {
          for (const id of chunk) asking.current.delete(id);
          if (!cancelled) setFailed(true);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [wanted]);

  useEffect(() => {
    current.current?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const label = (id: string, i: number) => {
    const found = names.get(id);
    return found?.title ? titleWithAuthor(found.title, found.author) : names.has(id) ? `Song ${i + 1}` : "Loading…";
  };

  const left = ids.length - (index + upcoming.length);
  return (
    <div className={`upNext ${inline ? "upNext--inline" : ""}`} role="region" aria-label="Songs coming up">
      <ol className="upNext__list" start={index + 1}>
        {upcoming.map((id, offset) => {
          const i = index + offset;
          const isNow = offset === 0;
          return (
            <li key={`${id}-${i}`} ref={isNow ? current : undefined} className={isNow ? "is-now" : ""}>
              <button type="button" disabled={readOnly} onClick={() => onPlay(i)} aria-current={isNow ? "true" : undefined}>
                <span className="upNext__n">{isNow ? "▶" : i + 1}</span>
                <span className="upNext__t">{label(id, i)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {failed && <p className="upNext__note">Some names could not be loaded. The songs still play.</p>}
      {left > 0 && (
        <button type="button" className="upNext__more" onClick={() => setShown((n) => n + STEP)}>
          Show {Math.min(STEP, left)} more ({left} left)
        </button>
      )}
    </div>
  );
}

export default memo(UpNext);
