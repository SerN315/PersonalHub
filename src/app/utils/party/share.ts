import type { PartyState } from "@/app/apis/party";

// Every answer from the server is brand-new objects, even when nothing about the people or the line-up changed. React cannot tell, so it would
// redraw every row each time. This keeps the OLD object wherever the content is the same, so only what really changed is redrawn.

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// the same list, item for item, when nothing in it changed; otherwise a list that reuses every unchanged item
function reuseList<T extends { id: string }>(prev: T[] | undefined, next: T[]): T[] {
  if (!prev) return next;
  const before = new Map(prev.map((item) => [item.id, item]));
  const merged = next.map((item) => {
    const old = before.get(item.id);
    return old && sameJson(old, item) ? old : item;
  });
  return merged.length === prev.length && merged.every((item, i) => item === prev[i]) ? prev : merged;
}

export function shareState(prev: PartyState | null, next: PartyState): PartyState {
  if (!prev || prev.id !== next.id) return next;
  return {
    ...next,
    members: reuseList(prev.members, next.members),
    queue: reuseList(prev.queue, next.queue),
    now: prev.now && next.now && sameJson(prev.now, next.now) ? prev.now : next.now,
  };
}
