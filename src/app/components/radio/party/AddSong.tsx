"use client";
import { memo, useEffect, useState, type ReactNode } from "react";
import BasicIcon from "../../ultis/icons";
import { getYouTubeName, searchStations, type Station, type YouTubeResult } from "@/app/apis/radio";
import { playNow, suggestSong, type Pick } from "@/app/apis/party";
import { parseYouTubeLink, titleWithAuthor } from "@/app/utils/radio/radioData";
import { usePartyStore } from "@/app/utils/party/store";
import { SearchYouTube, TrendingYouTube } from "./YouTubeBrowse";
import { useSearchAccess } from "./useSearchAccess";

// Choosing music for the party. The host plays things straight away or lines them up; everyone else suggests, and the host decides.
// There are several ways to find a song and ONE is shown at a time: a station, a pasted link, what is popular, and (only for the people the
// owner allows, because it uses the day's limited allowance) a YouTube search.
type Way = "station" | "link" | "trending" | "search";

function StationSearch({ render }: { render: (station: Station) => ReactNode }) {
  const [text, setText] = useState("");
  const [found, setFound] = useState<Station[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        searchStations({ q: text }, controller.signal)
          .then((stations) => {
            setFound(stations.slice(0, 12));
            setState("ready");
          })
          .catch(() => !controller.signal.aborted && setState("error"));
      },
      text ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  return (
    <div className="addSong__stations">
      <label className="addSong__search">
        <BasicIcon icon="Search01Icon" size={16} />
        <span className="sr-only">Search stations</span>
        <input type="search" value={text} maxLength={60} placeholder="Find a station, genre or country" onChange={(e) => setText(e.target.value)} />
      </label>
      {state === "error" && <p className="addSong__note">The station guide is not answering. Try again in a moment.</p>}
      {state === "ready" && found.length === 0 && <p className="addSong__note">No stations found.</p>}
      <ul className="addSong__list" aria-busy={state === "loading"}>
        {found.map((station) => (
          <li key={station.id}>
            <span className="addSong__name">
              {station.name}
              <small>{[station.country, station.tags[0]].filter(Boolean).join(" · ")}</small>
            </span>
            {render(station)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddSong({ host }: { host: boolean }) {
  const act = usePartyStore((s) => s.act);
  const canSearch = useSearchAccess();
  const [chosen, setChosen] = useState<Way>("station");
  const tab: Way = chosen === "search" && !canSearch ? "station" : chosen; // if the owner takes search away, the page moves on by itself
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const note = (text: string) => {
    setAdded(text);
    setTimeout(() => setAdded((now) => (now === text ? null : now)), 2500);
  };

  const sendStation = async (station: Station, how: "now" | "line") => {
    const pick: Pick = { kind: "station", ref: station.id };
    const done = await act((id) => (how === "now" ? playNow(id, pick) : suggestSong(id, pick)));
    if (done) note(how === "now" ? `Playing ${station.name}` : host ? `Added ${station.name}` : `Suggested ${station.name}`);
  };

  // a result of a YouTube search or the popular list: the title is already known, so nothing more is looked up
  const sendResult = async (result: YouTubeResult, how: "now" | "line") => {
    const pick: Pick = { kind: result.kind, ref: result.id, title: titleWithAuthor(result.title, result.author).slice(0, 120) };
    const done = await act((id) => (how === "now" ? playNow(id, pick) : suggestSong(id, pick)));
    if (done) note(how === "now" ? `Playing ${result.title}` : host ? `Added ${result.title}` : `Suggested ${result.title}`);
  };
  const resultActions = (result: YouTubeResult) => (
    <span className="addSong__acts">
      {host && (
        <button type="button" className="miniBtn miniBtn--go" onClick={() => void sendResult(result, "now")} aria-label={`Play ${result.title} now`}>
          <BasicIcon icon="PlayIcon" size={13} /> Play
        </button>
      )}
      <button type="button" className="miniBtn" onClick={() => void sendResult(result, "line")} aria-label={`${host ? "Add" : "Suggest"} ${result.title}`}>
        <BasicIcon icon="PlusSignIcon" size={13} /> {host ? "Add" : "Suggest"}
      </button>
    </span>
  );

  const submitLink = async (how: "now" | "line") => {
    const parsed = parseYouTubeLink(link);
    if (!parsed) return setProblem("That does not look like a YouTube or YouTube Music link.");
    setProblem(null);
    // no name typed: use the title and channel YouTube reports (the song still plays if they cannot be found)
    const typed = title.trim();
    const found = typed ? null : await getYouTubeName(parsed.kind, parsed.ref).catch(() => null);
    const name = typed || titleWithAuthor(found?.title, found?.author);
    const pick: Pick = { kind: parsed.kind, ref: parsed.ref, ...(name ? { title: name.slice(0, 120) } : {}) };
    const done = await act((id) => (how === "now" ? playNow(id, pick) : suggestSong(id, pick)));
    if (done) {
      setLink("");
      setTitle("");
      note(how === "now" ? "Playing now" : host ? "Added to the line-up" : "Suggested");
    }
  };

  return (
    <section className="partyBox addSong" aria-label={host ? "Choose music" : "Suggest a song"}>
      <h3>{host ? "Choose the music" : "Suggest a song"}</h3>
      <div className="addSong__tabs" role="group" aria-label="Ways to find a song">
        <button type="button" className="chip" aria-pressed={tab === "station"} onClick={() => setChosen("station")}>
          <BasicIcon icon="Radio01Icon" size={14} /> Station
        </button>
        <button type="button" className="chip" aria-pressed={tab === "link"} onClick={() => setChosen("link")}>
          <BasicIcon icon="Link01Icon" size={14} /> Paste link
        </button>
        <button type="button" className="chip" aria-pressed={tab === "trending"} onClick={() => setChosen("trending")}>
          <BasicIcon icon="StarIcon" size={14} /> Popular
        </button>
        {canSearch && (
          <button type="button" className="chip" aria-pressed={tab === "search"} onClick={() => setChosen("search")}>
            <BasicIcon icon="Search01Icon" size={14} /> Search
          </button>
        )}
      </div>

      {tab === "trending" && <TrendingYouTube render={resultActions} />}
      {tab === "search" && <SearchYouTube render={resultActions} />}
      {tab === "station" && (
        <StationSearch
          render={(station) => (
            <span className="addSong__acts">
              {host && (
                <button type="button" className="miniBtn miniBtn--go" onClick={() => void sendStation(station, "now")}>
                  <BasicIcon icon="PlayIcon" size={13} /> Play
                </button>
              )}
              <button type="button" className="miniBtn" onClick={() => void sendStation(station, "line")}>
                <BasicIcon icon="PlusSignIcon" size={13} /> {host ? "Add" : "Suggest"}
              </button>
            </span>
          )}
        />
      )}
      {tab === "link" && (
        <form
          className="addSong__link"
          onSubmit={(event) => {
            event.preventDefault();
            void submitLink(host ? "now" : "line");
          }}
        >
          <label>
            <span className="sr-only">YouTube link</span>
            <input type="text" value={link} maxLength={300} placeholder="Paste a video or playlist link" onChange={(e) => setLink(e.target.value)} aria-invalid={problem ? true : undefined} />
          </label>
          <label>
            <span className="sr-only">Name (optional)</span>
            <input type="text" value={title} maxLength={120} placeholder="Name it (optional, we use the title)" onChange={(e) => setTitle(e.target.value)} />
          </label>
          <span className="addSong__acts">
            {host && (
              <button type="submit" className="miniBtn miniBtn--go">
                <BasicIcon icon="PlayIcon" size={13} /> Play now
              </button>
            )}
            <button type="button" className="miniBtn" onClick={() => void submitLink("line")}>
              <BasicIcon icon="PlusSignIcon" size={13} /> {host ? "Add to line-up" : "Suggest"}
            </button>
          </span>
          {problem && (
            <p className="addSong__note is-error" role="alert">
              {problem}
            </p>
          )}
        </form>
      )}
      <p className="addSong__done" role="status">
        {added ?? ""}
      </p>
    </section>
  );
}

export default memo(AddSong);
