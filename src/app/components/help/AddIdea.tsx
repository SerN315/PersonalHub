"use client";
import { useEffect, useRef, useState } from "react";
import { useEscape } from "../widgets/radio/useEscape";

// "Add an idea": anyone may suggest something; the backend emails it to the owner (rate limited, length limited).
export default function AddIdea() {
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const firstField = useRef<HTMLTextAreaElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEscape(() => open && !sending && setOpen(false));
  useEffect(() => {
    if (open) firstField.current?.focus();
    else opener.current?.focus({ preventScroll: true });
  }, [open]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (idea.trim().length < 5) return setMessage("Please write a little more (at least 5 characters).");
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, email: email || undefined, page: "help" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not send your idea.");
      setMessage("Sent. Thank you!");
      setIdea("");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send your idea.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button type="button" ref={opener} className="help__cta" onClick={() => (setOpen(true), setMessage(""))}>
        Add an idea
      </button>

      {open && (
        <div className="ideaScrim" onMouseDown={(event) => event.target === event.currentTarget && !sending && setOpen(false)}>
          <form className="idea" role="dialog" aria-modal="true" aria-label="Add an idea" onSubmit={send}>
            <h3>Add an idea</h3>
            <p>It goes straight to the owner. Nothing else is collected.</p>
            <label>
              Your idea
              <textarea ref={firstField} value={idea} onChange={(e) => setIdea(e.target.value)} rows={5} maxLength={2000} placeholder="What would make this hub better for you?" />
            </label>
            <label>
              Your email (optional, if you would like a reply)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} placeholder="you@example.com" />
            </label>
            {message && <p className="idea__message" role="status">{message}</p>}
            <div className="idea__actions">
              <button type="button" onClick={() => setOpen(false)} disabled={sending}>Close</button>
              <button type="submit" className="is-primary" disabled={sending}>{sending ? "Sending..." : "Send"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
