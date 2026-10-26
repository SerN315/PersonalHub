"use client";
import { memo, useEffect, useState, type ReactNode } from "react";
import BasicIcon from "../../ultis/icons";
import { searchStations, type Station } from "@/app/apis/radio";
import { playNow, suggestSong, type Pick } from "@/app/apis/party";
import { parseYouTubeLink } from "@/app/utils/radio/radioData";
import { usePartyStore } from "@/app/utils/party/store";

// Choosing music for the party. The host plays things straight away or lines them up; everyone else suggests, and the host decides.

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
  const [tab, setTab] = useState<"station" | "youtube">("station");
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

  const submitLink = async (how: "now" | "line") => {
    const parsed = parseYouTubeLink(link);
    if (!parsed) return setProblem("That does not look like a YouTube or YouTube Music link.");
    if (parsed.kind === "playlist" && !host) return setProblem("Suggest one video at a time. The host can play whole playlists.");
    if (parsed.kind === "playlist" && how === "line") return setProblem("A whole playlist can be played right now, not lined up. Use a link to one video to line it up.");
    setProblem(null);
    const pick: Pick = { kind: parsed.kind, ref: parsed.ref, ...(title.trim() ? { title: title.trim().slice(0, 120) } : {}) };
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
      <div className="addSong__tabs" role="group" aria-label="What to pick">
        <button type="button" className="chip" aria-pressed={tab === "station"} onClick={() => setTab("station")}>
          <BasicIcon icon="Radio01Icon" size={14} /> Station
        </button>
        <button type="button" className="chip" aria-pressed={tab === "youtube"} onClick={() => setTab("youtube")}>
          <BasicIcon icon="YoutubeIcon" size={14} /> YouTube
        </button>
      </div>

      {tab === "station" ? (
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
      ) : (
        <form
          className="addSong__link"
          onSubmit={(event) => {
            event.preventDefault();
            void submitLink(host ? "now" : "line");
          }}
        >
          <label>
            <span className="sr-only">YouTube link</span>
            <input type="text" value={link} maxLength={300} placeholder={host ? "Paste a video or playlist link" : "Paste a video link"} onChange={(e) => setLink(e.target.value)} aria-invalid={problem ? true : undefined} />
          </label>
          <label>
            <span className="sr-only">Name (optional)</span>
            <input type="text" value={title} maxLength={120} placeholder="Name it (optional)" onChange={(e) => setTitle(e.target.value)} />
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
