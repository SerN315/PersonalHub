"use client";
import { memo, useEffect, useState, type ReactNode } from "react";
import BasicIcon from "../../ultis/icons";
import { ApiError } from "@/app/apis/http";
import { getTrending, searchYouTube, type YouTubeResult } from "@/app/apis/radio";
import { REGIONS, regionFromLocale } from "@/app/utils/radio/region";

// Finding songs on YouTube without a link: search it (only for the people the owner allows, because each search uses a hundredth of the day's
// allowance) or see what is popular in music in a country (cheap, for everyone). Results show YouTube's own little pictures.

function Results({ results, render }: { results: YouTubeResult[]; render: (result: YouTubeResult) => ReactNode }) {
  return (
    <ul className="ytResults">
      {results.map((result) => (
        <li key={`${result.kind}-${result.id}`}>
          {/* the picture is YouTube's own and only decoration: the title says everything */}
          {result.thumb ? <img src={result.thumb} alt="" width={80} height={45} loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : <span className="ytResults__blank" aria-hidden />}
          <span className="addSong__name">
            <span className="ytResults__title">{result.title}</span>
            <small>{[result.kind === "playlist" ? "Playlist" : null, result.author].filter(Boolean).join(" · ")}</small>
          </span>
          {render(result)}
        </li>
      ))}
    </ul>
  );
}

const messageOf = (error: unknown) => (error instanceof ApiError || error instanceof Error ? error.message : "Something went wrong");

// ---- Search -----------------------------------------------------------------------------------------------------------------------
export const SearchYouTube = memo(function SearchYouTube({ render }: { render: (result: YouTubeResult) => ReactNode }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"video" | "playlist">("video");
  const [state, setState] = useState<{ status: "idle" | "loading" | "ready" | "error"; results: YouTubeResult[]; message?: string; remaining?: number; asked?: string }>({ status: "idle", results: [] });

  const search = async (event?: React.FormEvent, chosen: "video" | "playlist" = kind) => {
    event?.preventDefault();
    const q = text.replace(/\s+/g, " ").trim();
    if (q.length < 2) return setState({ status: "error", results: [], message: "Type at least two letters." });
    setState((s) => ({ ...s, status: "loading", message: undefined }));
    try {
      const answer = await searchYouTube(q, chosen);
      setState({ status: "ready", results: answer.results, remaining: answer.remaining, asked: q });
    } catch (error) {
      setState((s) => ({ status: "error", results: s.results, remaining: error instanceof ApiError && error.status === 429 ? 0 : s.remaining, message: messageOf(error) }));
    }
  };

  const choose = (next: "video" | "playlist") => {
    setKind(next);
    if (state.asked) void search(undefined, next); // the same words, for the other kind
  };

  return (
    <div className="addSong__stations">
      <form className="addSong__search" onSubmit={(event) => void search(event)} role="search">
        <BasicIcon icon="Search01Icon" size={16} />
        <label>
          <span className="sr-only">Search YouTube</span>
          <input type="search" value={text} maxLength={80} placeholder="Search YouTube, then press Enter" onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit" className="miniBtn miniBtn--go" disabled={state.status === "loading"}>
          Search
        </button>
      </form>
      <div className="addSong__kinds" role="group" aria-label="Look for">
        <button type="button" className="chip" aria-pressed={kind === "video"} onClick={() => choose("video")}>
          Songs
        </button>
        <button type="button" className="chip" aria-pressed={kind === "playlist"} onClick={() => choose("playlist")}>
          Playlists
        </button>
        {state.remaining !== undefined && <small className="addSong__left">{state.remaining > 0 ? `${state.remaining} searches left today` : "No searches left today"}</small>}
      </div>
      {state.status === "loading" && <p className="addSong__note">Searching…</p>}
      {state.status === "error" && (
        <p className="addSong__note is-error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "ready" && state.results.length === 0 && <p className="addSong__note">Nothing found for that. Try other words.</p>}
      <Results results={state.results} render={render} />
    </div>
  );
});

// ---- Popular -----------------------------------------------------------------------------------------------------------------------
export const TrendingYouTube = memo(function TrendingYouTube({ render }: { render: (result: YouTubeResult) => ReactNode }) {
  const [region, setRegion] = useState(() => regionFromLocale(typeof navigator === "undefined" ? undefined : navigator.language));
  const [state, setState] = useState<{ region: string; status: "loading" | "ready" | "error"; results: YouTubeResult[]; message?: string }>({ region, status: "loading", results: [] });

  useEffect(() => {
    const controller = new AbortController();
    getTrending(region, controller.signal)
      .then((answer) => setState({ region, status: "ready", results: answer.results }))
      .catch((error) => !controller.signal.aborted && setState({ region, status: "error", results: [], message: messageOf(error) }));
    return () => controller.abort();
  }, [region]);

  const loading = state.region !== region || state.status === "loading";
  return (
    <div className="addSong__stations">
      <label className="addSong__region">
        <span>Popular music in</span>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {REGIONS.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {loading && <p className="addSong__note">Loading…</p>}
      {!loading && state.status === "error" && (
        <p className="addSong__note is-error" role="alert">
          {state.message}
        </p>
      )}
      {!loading && state.status === "ready" && state.results.length === 0 && <p className="addSong__note">Nothing to show for this country.</p>}
      {!loading && <Results results={state.results} render={render} />}
    </div>
  );
});
