"use client";
import { memo, useEffect, useRef, useState } from "react";
import BasicIcon from "../../ultis/icons";
import { deleteChat } from "@/app/apis/party";
import { usePartyStore } from "@/app/utils/party/store";
import type { ChatMessage } from "@/app/utils/party/chat";

// The party's chat: a short memory (the last sixty things said), plain text only, kept on the server for as long as the party runs.
// A message is drawn once and never redrawn; a new one only adds a line at the bottom.

const clock = (at: number) => (at ? new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");

const Line = memo(function Line({ message, canDelete }: { message: ChatMessage; canDelete: boolean }) {
  const act = usePartyStore((s) => s.act);
  return (
    <li className={`chatLine ${message.mine ? "is-mine" : ""}`}>
      <span className="chatLine__who">
        {message.mine ? "You" : message.name} <time>{clock(message.at)}</time>
      </span>
      <span className="chatLine__text">{message.text}</span>
      {canDelete && (
        <button type="button" className="chatLine__del" onClick={() => void act((id) => deleteChat(id, message.n))} aria-label={`Remove ${message.name}'s message`} title="Remove this message">
          <BasicIcon icon="Cancel01Icon" size={12} />
        </button>
      )}
    </li>
  );
});

function ChatBox() {
  const messages = usePartyStore((s) => s.messages);
  const isHost = usePartyStore((s) => s.party?.isHost ?? false);
  const say = usePartyStore((s) => s.say);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const log = useRef<HTMLUListElement>(null);
  const last = messages.at(-1)?.n ?? 0;

  // stay at the newest line, unless you have scrolled up to read something older
  useEffect(() => {
    const el = log.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTop = el.scrollHeight;
  }, [last]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const line = text.trim();
    if (!line || sending) return;
    setSending(true);
    const ok = await say(line);
    setSending(false);
    if (ok) {
      setText("");
      requestAnimationFrame(() => log.current && (log.current.scrollTop = log.current.scrollHeight));
    }
  };

  return (
    <section className="partyBox chat" aria-label="Chat">
      <h3>Chat</h3>
      <ul ref={log} className="chat__log" role="log" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && <li className="chat__empty">Say hi. Only the last few messages are kept, and they are gone when the party ends.</li>}
        {messages.map((m) => (
          <Line key={m.n} message={m} canDelete={isHost} />
        ))}
      </ul>
      <form className="chat__form" onSubmit={send}>
        <label>
          <span className="sr-only">Message</span>
          <input type="text" value={text} maxLength={200} placeholder="Say something" autoComplete="off" onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit" className="miniBtn miniBtn--go" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}

export default memo(ChatBox);
