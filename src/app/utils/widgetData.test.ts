import { test } from "node:test";
import assert from "node:assert/strict";
import { asRecord } from "./widgetData.ts";

test("real objects pass through, nothing else becomes an object by accident", () => {
  assert.deepEqual(asRecord({ a: 1 }), { a: 1 });
  for (const bad of [null, undefined, 5, true, [1, 2]]) assert.deepEqual(asRecord(bad), {});
});

test("text is parsed back, however many times it was wrapped", () => {
  const data = { favorites: [{ id: "x" }], volume: 0.5 };
  assert.deepEqual(asRecord(JSON.stringify(data)), data);
  assert.deepEqual(asRecord(JSON.stringify(JSON.stringify(data))), data);
  assert.deepEqual(asRecord("not json"), {});
});

test("one entry per character is stripped, the real keys beside it kept", () => {
  const damaged = { ...(JSON.stringify({ old: true }) as unknown as object), favorites: [1], volume: 0.7 };
  assert.ok("0" in damaged);
  assert.deepEqual(asRecord(damaged), { favorites: [1], volume: 0.7 });
});

test("spreading a repaired value can never grow into characters again", () => {
  const widgetData = asRecord(JSON.stringify({ tint: "sky" }));
  const next = { ...widgetData, note: "hello" };
  assert.deepEqual(Object.keys(next), ["tint", "note"]);
});
