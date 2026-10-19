"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/stickyNotes.scss";
import WidgetProps from "@/app/types/widget";

const SAVE_DELAY_MS = 700;
const MAX_LENGTH = 4000;

// A note that remembers: what you type is saved to your account a moment after you stop typing.
function StickyNotesWidget({ data, onData, ...props }: WidgetProps) {
  const saved = typeof data?.note === "string" ? data.note : "";
  const [note, setNote] = useState(saved);
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; text: string } | null>(null);
  const onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  });

  const flush = () => {
    if (!pending.current) return;
    clearTimeout(pending.current.timer);
    onDataRef.current?.(props.id, { note: pending.current.text });
    pending.current = null;
  };

  // Leaving the page (or removing the widget) must not lose the last few keystrokes.
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setNote(text);
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = { text, timer: setTimeout(flush, SAVE_DELAY_MS) };
  };

  return (
    <BaseWidget title="Sticky note" {...props}>
      <div className="sticky">
        <textarea
          className="sticky__text"
          value={note}
          maxLength={MAX_LENGTH}
          onChange={onChange}
          onBlur={flush}
          placeholder="Jot something down…"
          aria-label="Sticky note"
          spellCheck
        />
        <div className="sticky__fold" aria-hidden />
      </div>
    </BaseWidget>
  );
}

export default memo(StickyNotesWidget);
