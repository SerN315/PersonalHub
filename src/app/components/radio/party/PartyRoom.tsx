"use client";
import { memo, useEffect, useRef, useState } from "react";
import BasicIcon from "../../ultis/icons";
import AddSong from "./AddSong";
import ChatBox from "./ChatBox";
import PartyPlayer from "./PartyPlayer";
import PartySync, { stationOf } from "./PartySync";
import { EMOJIS, approveItem, kickMember, muteMember, playItem, removeItem, skipSong, type PartyMember, type PartySong, type QueueItem } from "@/app/apis/party";
import { usePartyStore } from "@/app/utils/party/store";
import { useRadioStore } from "@/app/utils/radio/engine";
import "@/app/styles/pages/party.scss";

const labelOf = (item: { title: string | null; name: string | null; kind: string }) => item.title || item.name || (item.kind === "playlist" ? "YouTube playlist" : "YouTube video");

// ---- what is playing ---------------------------------------------------------------------------------------------------------------
function NowPlaying() {
  const now = usePartyStore((s) => s.party?.now ?? null);
  const serverMs = usePartyStore((s) => s.party?.serverMs ?? 0);
  const isHost = usePartyStore((s) => s.party?.isHost ?? false);
  const partyId = usePartyStore((s) => s.party?.id ?? "");
  const act = usePartyStore((s) => s.act);
  const engineStation = useRadioStore((s) => s.station);
  const engineStatus = useRadioStore((s) => s.status);
  const engineTitle = useRadioStore((s) => s.title);

  const station = now ? stationOf(now) : null;
  const listening = !!station && engineStation?.id === station.id && (engineStatus === "playing" || engineStatus === "loading");

  return (
    <section className="partyBox partyNow" aria-label="Now playing">
      <h3>Now playing</h3>
      {!now && <p className="partyNow__empty">{isHost ? "Nothing yet. Choose a station or a video below." : "Waiting for the host to choose something."}</p>}
      {now && station && (
        <div className="partyNow__station">
          <span className={`lamp ${listening && engineStatus === "playing" ? "is-lit" : ""}`} aria-hidden />
          <div>
            <strong>{station.name}</strong>
            <small>{listening ? (engineStatus === "loading" ? "Tuning…" : engineTitle || "On air") : engineStatus === "error" ? "This station is not reachable right now." : "Not playing on this device"}</small>
          </div>
          {!listening && (
            <button type="button" className="miniBtn miniBtn--go" onClick={() => useRadioStore.getState().tune(station)}>
              <BasicIcon icon="HeadphonesIcon" size={14} /> Listen along
            </button>
          )}
        </div>
      )}
      {now && now.kind !== "station" && <PartyVideo key={now.kind} song={now} serverMs={serverMs} host={isHost} partyId={partyId} />}
      {isHost && now && (
        <div className="partyNow__host">
          <button type="button" className="miniBtn" onClick={() => void act((id) => skipSong(id))}>
            <BasicIcon icon="NextIcon" size={13} /> Next
          </button>
        </div>
      )}
    </section>
  );
}

function PartyVideo({ song, serverMs, host, partyId }: { song: PartySong; serverMs: number; host: boolean; partyId: string }) {
  return (
    <div className="partyNow__video">
      <PartyPlayer song={song} serverMs={serverMs} host={host} partyId={partyId} />
      <p className="partyNow__caption">
        {labelOf(song)}
        {!host && song.kind === "video" && <small> · follows the host (within a few seconds)</small>}
      </p>
    </div>
  );
}

// ---- reactions ---------------------------------------------------------------------------------------------------------------------
function FloatingEmoji({ id }: { id: number }) {
  const settled = usePartyStore((s) => s.settled);
  useEffect(() => {
    const timer = setTimeout(() => settled(id), 3200); // also covers "reduce motion", where nothing animates
    return () => clearTimeout(timer);
  }, [id, settled]);
  return null;
}

function Reactions() {
  const floating = usePartyStore((s) => s.floating);
  const react = usePartyStore((s) => s.react);
  const [cooling, setCooling] = useState(false);
  const press = (emoji: string) => {
    if (cooling) return;
    react(emoji);
    setCooling(true);
    setTimeout(() => setCooling(false), 700);
  };
  return (
    <section className="partyBox partyReact" aria-label="Reactions">
      <div className="partyReact__bar" role="group" aria-label="Send a reaction">
        {EMOJIS.map((emoji) => (
          <button key={emoji} type="button" className="partyReact__btn" onClick={() => press(emoji)} aria-label={`React with ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
      <div className="partyReact__sky" aria-hidden>
        {floating.map((f) => (
          <span key={f.key} className="partyReact__float" style={{ left: `${10 + ((f.key * 37) % 80)}%` }} title={f.name}>
            {f.emoji}
            <FloatingEmoji id={f.key} />
          </span>
        ))}
      </div>
    </section>
  );
}

// ---- people ------------------------------------------------------------------------------------------------------------------------
const Person = memo(function Person({ member, canRemove, onRemove }: { member: PartyMember; canRemove: boolean; onRemove: (member: PartyMember) => void }) {
  const act = usePartyStore((s) => s.act);
  return (
    <li className="person">
      <span className="person__dot" aria-hidden>
        {member.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="person__name">{member.name}</span>
      {member.host && <span className="person__tag">Host</span>}
      {member.muted && <span className="person__tag person__tag--quiet">Muted</span>}
      {canRemove && !member.host && (
        <>
          <button type="button" className="miniBtn" onClick={() => void act((id) => muteMember(id, member.id, !member.muted))} aria-label={member.muted ? `Let ${member.name} chat again` : `Mute ${member.name} in the chat`} title={member.muted ? "Let them chat again" : "Mute in the chat"}>
            {member.muted ? "Unmute" : "Mute"}
          </button>
          <button type="button" className="miniBtn miniBtn--danger" onClick={() => onRemove(member)} aria-label={`Remove ${member.name} from the party`}>
            <BasicIcon icon="Cancel01Icon" size={13} />
          </button>
        </>
      )}
    </li>
  );
});

function People() {
  const members = usePartyStore((s) => s.party?.members ?? []);
  const isHost = usePartyStore((s) => s.party?.isHost ?? false);
  const act = usePartyStore((s) => s.act);
  const [asking, setAsking] = useState<PartyMember | null>(null);
  return (
    <section className="partyBox" aria-label="Who is here">
      <h3>Here now ({members.length})</h3>
      <ul className="people">
        {members.map((m) => (
          <Person key={m.id} member={m} canRemove={isHost} onRemove={setAsking} />
        ))}
      </ul>
      {asking && (
        <div className="partyAsk" role="alertdialog" aria-label={`Remove ${asking.name}?`}>
          <p>Remove {asking.name}? They will not be able to come back with the code.</p>
          <span>
            <button type="button" className="miniBtn miniBtn--danger" onClick={() => void act((id) => kickMember(id, asking.id)).then(() => setAsking(null))}>
              Remove
            </button>
            <button type="button" className="miniBtn" onClick={() => setAsking(null)}>
              Keep
            </button>
          </span>
        </div>
      )}
    </section>
  );
}

// ---- the line-up -------------------------------------------------------------------------------------------------------------------
const Row = memo(function Row({ item, isHost }: { item: QueueItem; isHost: boolean }) {
  const act = usePartyStore((s) => s.act);
  return (
    <li className={`lineup__item ${item.status === "pending" ? "is-pending" : ""}`}>
      <BasicIcon icon={item.kind === "station" ? "Radio01Icon" : "YoutubeIcon"} size={16} />
      <span className="lineup__text">
        <strong>{labelOf(item)}</strong>
        <small>
          {item.mine ? "You" : item.by} · {item.status === "pending" ? "waiting for the host" : "up next"}
        </small>
      </span>
      <span className="lineup__acts">
        {isHost && item.status === "pending" && (
          <button type="button" className="miniBtn miniBtn--go" onClick={() => void act((id) => approveItem(id, item.id))} aria-label={`Approve ${labelOf(item)}`}>
            <BasicIcon icon="Tick02Icon" size={13} />
          </button>
        )}
        {isHost && (
          <button type="button" className="miniBtn" onClick={() => void act((id) => playItem(id, item.id))} aria-label={`Play ${labelOf(item)} now`}>
            <BasicIcon icon="PlayIcon" size={13} />
          </button>
        )}
        {(isHost || (item.mine && item.status === "pending")) && (
          <button type="button" className="miniBtn miniBtn--danger" onClick={() => void act((id) => removeItem(id, item.id))} aria-label={isHost ? `Remove ${labelOf(item)}` : "Take back my suggestion"}>
            <BasicIcon icon="Cancel01Icon" size={13} />
          </button>
        )}
      </span>
    </li>
  );
});

function LineUp() {
  const queue = usePartyStore((s) => s.party?.queue ?? []);
  const isHost = usePartyStore((s) => s.party?.isHost ?? false);
  // the suggestions the host has not looked at yet come first, then what is lined up
  const ordered = [...queue.filter((q) => q.status === "pending"), ...queue.filter((q) => q.status === "queued")];
  return (
    <section className="partyBox" aria-label="The line-up">
      <h3>The line-up</h3>
      {ordered.length === 0 ? <p className="partyNow__empty">{isHost ? "Suggestions from your guests show up here." : "Suggest something and the host will see it."}</p> : <ul className="lineup">{ordered.map((item) => <Row key={item.id} item={item} isHost={isHost} />)}</ul>}
    </section>
  );
}

// ---- the room ----------------------------------------------------------------------------------------------------------------------
function Invite({ code }: { code: string }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const copy = async (what: "link" | "code") => {
    const text = what === "link" ? `${window.location.origin}/radio?party=${code}` : code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* the code is on screen to read out */
    }
  };
  return (
    <div className="invite">
      <span className="invite__code" aria-label={`Invite code ${code.split("").join(" ")}`}>
        {code.slice(0, 4)}-{code.slice(4)}
      </span>
      <button type="button" className="miniBtn" onClick={() => void copy("link")}>
        <BasicIcon icon="Link01Icon" size={13} /> {copied === "link" ? "Copied" : "Copy invite link"}
      </button>
      <button type="button" className="miniBtn" onClick={() => void copy("code")}>
        {copied === "code" ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}

function Header() {
  const name = usePartyStore((s) => s.party?.name ?? "");
  const code = usePartyStore((s) => s.party?.code);
  const isHost = usePartyStore((s) => s.party?.isHost ?? false);
  const online = usePartyStore((s) => s.online);
  const leave = usePartyStore((s) => s.leave);
  const end = usePartyStore((s) => s.end);
  const [sure, setSure] = useState(false);
  return (
    <header className="partyHead">
      <div>
        <p className="partyHead__eyebrow">{isHost ? "You are hosting" : "You are listening together"}</p>
        <h2>{name}</h2>
        {!online && <p className="partyHead__offline">Reconnecting…</p>}
      </div>
      {isHost && code && <Invite code={code} />}
      {isHost ? (
        <button type="button" className={`miniBtn miniBtn--danger ${sure ? "is-armed" : ""}`} onClick={() => (sure ? void end() : setSure(true))} onBlur={() => setSure(false)}>
          {sure ? "Press again to end for everyone" : "End party"}
        </button>
      ) : (
        <button type="button" className="miniBtn" onClick={() => void leave()}>
          Leave party
        </button>
      )}
    </header>
  );
}

function Notice() {
  const message = usePartyStore((s) => s.message);
  const clear = usePartyStore((s) => s.clearMessage);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clear, 6000);
    return () => clearTimeout(timer);
  }, [message, clear]);
  if (!message) return null;
  return (
    <p className="partyNotice" role="alert">
      {message}
      <button type="button" onClick={clear} aria-label="Dismiss">
        <BasicIcon icon="Cancel01Icon" size={14} />
      </button>
    </p>
  );
}

function PartyRoom() {
  const isHost = usePartyStore((s) => s.party?.isHost ?? false);
  const room = useRef<HTMLDivElement>(null);
  // starting or joining brings the room into view (the radio above it is tall)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    room.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);
  return (
    <div ref={room} className="party" role="region" aria-label="Listening party">
      <PartySync />
      <Header />
      <Notice />
      <div className="party__grid">
        <div className="party__main">
          <NowPlaying />
          <Reactions />
          <AddSong host={isHost} />
        </div>
        <div className="party__side">
          <People />
          <ChatBox />
          <LineUp />
        </div>
      </div>
    </div>
  );
}

export default memo(PartyRoom);
