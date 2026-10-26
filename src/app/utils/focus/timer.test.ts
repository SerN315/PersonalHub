import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, cleanSettings, formatClock, nextMode, remainingSeconds, sandLeft, secondsFor, worthSaving } from "./timer.ts";

test("a round is four focus sessions with short breaks, then a long break, then it starts again", () => {
  const s = DEFAULT_SETTINGS;
  let step = { mode: "focus" as const, finished: 0 } as { mode: "focus" | "short" | "long"; finished: number };
  const order: string[] = [];
  for (let i = 0; i < 8; i++) {
    order.push(step.mode);
    // a focus session ends: it counts toward the round
    const finished = step.mode === "focus" ? step.finished + 1 : step.finished;
    const next = nextMode(step.mode, finished, s);
    step = { mode: next.mode, finished: next.finishedFocus };
  }
  assert.deepEqual(order, ["focus", "short", "focus", "short", "focus", "short", "focus", "long"]);
  assert.equal(step.mode, "focus");
  assert.equal(step.finished, 0, "the long break closed the round, so the next one starts a fresh round");
});

test("the long break comes after however many sessions the person chose", () => {
  assert.equal(nextMode("focus", 2, { ...DEFAULT_SETTINGS, longEvery: 2 }).mode, "long");
  assert.equal(nextMode("focus", 1, { ...DEFAULT_SETTINGS, longEvery: 2 }).mode, "short");
});

test("skipping a break keeps the round count; only the long break resets it", () => {
  assert.deepEqual(nextMode("short", 3, DEFAULT_SETTINGS), { mode: "focus", finishedFocus: 3 });
  assert.deepEqual(nextMode("long", 4, DEFAULT_SETTINGS), { mode: "focus", finishedFocus: 0 });
});

test("settings coming from storage are made valid", () => {
  assert.deepEqual(cleanSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(cleanSettings("junk"), DEFAULT_SETTINGS);
  const wild = cleanSettings({ focus: 9999, short: -4, long: "30", longEvery: 1, autoStart: "yes", sound: 0, notify: true });
  assert.deepEqual(wild, { focus: 120, short: 1, long: 30, longEvery: 2, autoStart: false, sound: true, notify: true });
  assert.equal(cleanSettings({ focus: 12.6 }).focus, 13);
  assert.equal(cleanSettings({ focus: NaN }).focus, 25);
});

test("durations come from the settings", () => {
  assert.equal(secondsFor("focus", DEFAULT_SETTINGS), 1500);
  assert.equal(secondsFor("long", { ...DEFAULT_SETTINGS, long: 20 }), 1200);
});

test("the time left is worked out from the end time, never counted down", () => {
  assert.equal(remainingSeconds(10_000, 4_000), 6);
  assert.equal(remainingSeconds(10_000, 9_001), 1, "part of a second still counts as one");
  assert.equal(remainingSeconds(10_000, 10_000), 0);
  assert.equal(remainingSeconds(10_000, 99_000), 0, "a tab that slept past the end is simply done");
});

test("the clock reads like a clock", () => {
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(59), "00:59");
  assert.equal(formatClock(1500), "25:00");
  assert.equal(formatClock(3600), "1:00:00");
  assert.equal(formatClock(3725), "1:02:05");
  assert.equal(formatClock(-5), "00:00");
});

test("the sand in the top bulb", () => {
  assert.equal(sandLeft(1500, 1500), 1);
  assert.equal(sandLeft(750, 1500), 0.5);
  assert.equal(sandLeft(0, 1500), 0);
  assert.equal(sandLeft(5, 0), 0);
  assert.equal(sandLeft(9999, 1500), 1);
});

test("a session stopped early is saved only if it lasted a minute", () => {
  assert.equal(worthSaving(30, 1500), null);
  assert.equal(worthSaving(59.4, 1500), null);
  assert.equal(worthSaving(60, 1500), 60);
  assert.equal(worthSaving(900, 1500), 900);
  assert.equal(worthSaving(99_999, 1500), 1620, "it can never be longer than the session (plus a little slack)");
});
