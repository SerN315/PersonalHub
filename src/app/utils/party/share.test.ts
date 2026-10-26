import { test } from "node:test";
import assert from "node:assert/strict";
import { shareState } from "./share.ts";
import type { PartyState } from "@/app/apis/party";

const member = (id: string, name = id, host = false) => ({ id, name, host });
const item = (id: string, over: Record<string, unknown> = {}) => ({ id, status: "queued" as const, kind: "video" as const, ref: "x", title: id, name: null, url: null, by: "A", mine: false, ...over });
const state = (over: Record<string, unknown> = {}): PartyState => ({ id: "p", name: "P", isHost: false, me: "m1", seq: 1, serverMs: 1, now: null, members: [member("m1"), member("m2")], queue: [item("q1"), item("q2")], rseq: 0, reactions: [], cn: 0, chat: [], ...over } as PartyState);
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

test("nothing changed: the very same lists come back, so nothing is redrawn", () => {
  const before = state();
  const after = shareState(before, clone(before));
  assert.equal(after.members, before.members);
  assert.equal(after.queue, before.queue);
});

test("one person joins: the others keep their objects, the list is new", () => {
  const before = state();
  const next = clone(before);
  next.members.push(member("m3"));
  const after = shareState(before, next);
  assert.notEqual(after.members, before.members);
  assert.equal(after.members[0], before.members[0]);
  assert.equal(after.members[1], before.members[1]);
  assert.equal(after.members.length, 3);
  assert.equal(after.queue, before.queue, "and the line-up is untouched");
});

test("one song changes: only that row is new", () => {
  const before = state();
  const next = clone(before);
  next.queue[1] = item("q2", { status: "pending" });
  const after = shareState(before, next);
  assert.equal(after.queue[0], before.queue[0]);
  assert.notEqual(after.queue[1], before.queue[1]);
  assert.equal(after.queue[1].status, "pending");
});

test("order, additions and removals are respected, never faked by reuse", () => {
  const before = state();
  const swapped = clone(before);
  swapped.queue.reverse();
  assert.deepEqual(shareState(before, swapped).queue.map((q) => q.id), ["q2", "q1"]);
  const shorter = clone(before);
  shorter.queue.pop();
  assert.deepEqual(shareState(before, shorter).queue.map((q) => q.id), ["q1"]);
  assert.deepEqual(shareState(before, { ...clone(before), queue: [] }).queue, []);
});

test("what is playing: the same object while it is the same, a new one when it moves", () => {
  const now = { kind: "video" as const, ref: "v", title: null, name: null, url: null, posMs: 5, playing: true, index: 0, posAtMs: 9, startedMs: 1 };
  const before = state({ now });
  assert.equal(shareState(before, clone(before)).now, before.now);
  const moved = clone(before);
  moved.now!.posMs = 9000;
  assert.notEqual(shareState(before, moved).now, before.now);
  assert.equal(shareState(before, { ...clone(before), now: null }).now, null);
});

test("a different party is taken as it is, and the new numbers always win", () => {
  const other = state({ id: "other" });
  assert.equal(shareState(state(), other), other);
  const next = clone(state());
  next.seq = 9;
  next.serverMs = 99;
  const after = shareState(state(), next);
  assert.deepEqual([after.seq, after.serverMs], [9, 99]);
});
