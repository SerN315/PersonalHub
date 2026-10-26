import type { ChatEvent } from "@/app/apis/party";

// The chat as this page shows it: the last few messages. The server sends EVENTS (a message, or "the host took message n away"); this turns a
// run of them into the list. Events can arrive twice (the first answer after joining, then again) and must never double a message.

export const MAX_MESSAGES = 60;

export interface ChatMessage {
  n: number;
  name: string;
  text: string;
  at: number;
  mine: boolean;
}

// The same list when nothing in `events` changes it (so nothing is redrawn), otherwise a new one.
export function mergeChat(list: ChatMessage[], events: ChatEvent[]): ChatMessage[] {
  let next = list;
  for (const event of events) {
    if (event.kind === "del") {
      if (next.some((m) => m.n === event.target)) next = next.filter((m) => m.n !== event.target);
    } else if (event.text !== undefined && !next.some((m) => m.n === event.n) && event.n > (next.at(-1)?.n ?? 0)) {
      next = [...next, { n: event.n, name: event.name ?? "Someone", text: event.text, at: event.at ?? 0, mine: !!event.mine }];
    }
  }
  return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
}

// does this run of events contain a message (so the page should listen closely for a while)?
export const hasMessage = (events: ChatEvent[]) => events.some((e) => e.kind === "msg");
