import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_MESSAGES, hasMessage, mergeChat } from "./chat.ts";

const msg = (n: number, text = `m${n}`, mine = false) => ({ n, kind: "msg" as const, name: "A", text, at: 1000 + n, mine });
const del = (n: number, target: number) => ({ n, kind: "del" as const, target });

test("messages are added in order", () => {
  const list = mergeChat([], [msg(1), msg(2)]);
  assert.deepEqual(list.map((m) => m.text), ["m1", "m2"]);
  assert.equal(list[0].mine, false);
  assert.equal(mergeChat([], [msg(3, "mine", true)])[0].mine, true);
});

test("the same event twice never doubles a message, and gives back the very same list", () => {
  const list = mergeChat([], [msg(1), msg(2)]);
  assert.equal(mergeChat(list, [msg(1), msg(2)]), list);
  assert.equal(mergeChat(list, []), list);
});

test("an older event than the newest message is ignored (a late, repeated answer)", () => {
  const list = mergeChat([], [msg(5)]);
  assert.equal(mergeChat(list, [msg(4)]), list);
});

test("the host taking a message away removes it, and a removal of something unknown changes nothing", () => {
  const list = mergeChat([], [msg(1), msg(2), msg(3)]);
  assert.deepEqual(mergeChat(list, [del(4, 2)]).map((m) => m.n), [1, 3]);
  assert.equal(mergeChat(list, [del(4, 99)]), list);
});

test("a message and its removal arriving together leave nothing", () => {
  assert.deepEqual(mergeChat([], [msg(1), del(2, 1)]), []);
});

test("only the last sixty are kept", () => {
  const events = Array.from({ length: MAX_MESSAGES + 15 }, (_, i) => msg(i + 1));
  const list = mergeChat([], events);
  assert.equal(list.length, MAX_MESSAGES);
  assert.deepEqual([list[0].n, list.at(-1)!.n], [16, MAX_MESSAGES + 15]);
});

test("text stays exactly as sent (it is only ever shown as text)", () => {
  assert.equal(mergeChat([], [msg(1, "<script>alert(1)</script>")])[0].text, "<script>alert(1)</script>");
});

test("knowing whether there is something to listen for", () => {
  assert.equal(hasMessage([]), false);
  assert.equal(hasMessage([del(2, 1)]), false);
  assert.equal(hasMessage([msg(1)]), true);
});
