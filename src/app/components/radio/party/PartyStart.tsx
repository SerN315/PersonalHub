"use client";
import { memo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BasicIcon from "../../ultis/icons";
import { usePartyStore } from "@/app/utils/party/store";

// Start a party, or join one with its invite code (the invite link /radio?party=CODE fills the code in; you still press Join).
function PartyStart() {
  const invited = useSearchParams().get("party") ?? "";
  const status = usePartyStore((s) => s.status);
  const message = usePartyStore((s) => s.message);
  const start = usePartyStore((s) => s.start);
  const join = usePartyStore((s) => s.join);
  const dismiss = usePartyStore((s) => s.dismiss);
  const [mode, setMode] = useState<"start" | "join">(invited ? "join" : "start");
  const [name, setName] = useState("");
  const [code, setCode] = useState(invited.slice(0, 12));
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const ok = mode === "start" ? await start(name) : await join(code);
    setBusy(false);
    if (ok && invited) window.history.replaceState(null, "", "/radio");
  };

  return (
    <section className="deskCard" aria-label="Listening party">
      <h2>
        <BasicIcon icon="HeadphonesIcon" size={16} /> Listen together
      </h2>
      {status === "ended" && (
        <p className="deskCard__fine" role="status">
          {message ?? "The party has ended."}{" "}
          <button type="button" className="linkBtn" onClick={dismiss}>
            OK
          </button>
        </p>
      )}
      <div className="deskCard__row" role="group" aria-label="Start or join">
        <button type="button" className="chip" aria-pressed={mode === "start"} onClick={() => setMode("start")}>
          Start a party
        </button>
        <button type="button" className="chip" aria-pressed={mode === "join"} onClick={() => setMode("join")}>
          Join with a code
        </button>
      </div>
      <form className="partyForm" onSubmit={submit}>
        {mode === "start" ? (
          <label>
            <span className="sr-only">Party name</span>
            <input type="text" value={name} maxLength={40} placeholder="Name it (optional)" onChange={(e) => setName(e.target.value)} />
          </label>
        ) : (
          <label>
            <span className="sr-only">Invite code</span>
            <input type="text" value={code} maxLength={12} placeholder="Invite code" autoCapitalize="characters" autoComplete="off" spellCheck={false} onChange={(e) => setCode(e.target.value)} />
          </label>
        )}
        <button type="submit" className="miniBtn miniBtn--go" disabled={busy || (mode === "join" && code.trim().length < 8)}>
          {mode === "start" ? "Start" : "Join"}
        </button>
      </form>
      {status !== "ended" && message && (
        <p className="addSong__note is-error" role="alert">
          {message}
        </p>
      )}
      <p className="deskCard__fine">Friends who are signed in can join with a code. You choose the music; they can suggest songs.</p>
    </section>
  );
}

export default memo(PartyStart);
