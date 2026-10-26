import { test } from "node:test";
import assert from "node:assert/strict";
import { hostMoved, hostPlace, isFresh, planFollow } from "./follow.ts";

const song = (over: Record<string, unknown> = {}) => ({ kind: "video" as const, ref: "dQw4w9WgXcQ", title: null, name: null, url: null, posMs: 60_000, playing: true, index: 0, posAtMs: 1_000_000, startedMs: 1, ...over });
const live = (over: Record<string, unknown> = {}) => ({ state: 1, time: 0, index: 0, ...over });
const seen = (over: Record<string, unknown> = {}) => ({ playing: true, index: 0, ...over });

test("the host's place moves on while they play and stands still while they are paused", () => {
  assert.equal(hostPlace(song(), 1_003_000), 63);
  assert.equal(hostPlace(song({ playing: false }), 1_050_000), 60);
  assert.equal(hostPlace(song({ posAtMs: null }), 5), 0);
  assert.equal(hostPlace(song(), 999_000), 60, "a clock that is a little behind never sends anyone backwards");
});

test("an old report is not trusted while the host is playing, but is while they are paused", () => {
  assert.equal(isFresh(song(), 1_010_000), true);
  assert.equal(isFresh(song(), 1_030_000), false);
  assert.equal(isFresh(song({ playing: false }), 1_900_000), true);
});

test("a playing guest who has drifted jumps to the host; a close one is left alone", () => {
  assert.equal(planFollow(song(), 1_002_000, seen(), live({ time: 10 })).seekTo, 62);
  assert.equal(planFollow(song(), 1_002_000, seen(), live({ time: 61 })).seekTo, undefined, "within two seconds");
  assert.equal(planFollow(song(), 1_002_000, seen(), live({ time: 63.5 })).seekTo, undefined);
  assert.equal(planFollow(song(), 1_002_000, seen(), live({ time: 10, state: 3 })).seekTo, 62, "buffering counts as playing");
});

test("a guest who paused alone is not dragged along, until the host does something new", () => {
  assert.equal(planFollow(song(), 1_002_000, seen(), live({ time: 10, state: 2 })).seekTo, undefined);
  assert.equal(planFollow(song(), 1_002_000, seen(), live({ time: 10, state: 2 })).play, undefined, "the host's state did not change, so nothing is forced");
});

test("the host pausing pauses the guest, and lines them up exactly", () => {
  const plan = planFollow(song({ playing: false, posMs: 90_000 }), 1_100_000, seen(), live({ time: 85 }));
  assert.equal(plan.pause, true);
  assert.equal(plan.play, undefined);
  assert.equal(plan.seekTo, 90);
  assert.equal(plan.seen.playing, false);
  assert.equal(planFollow(song({ playing: false, posMs: 90_000 }), 1_100_000, plan.seen, live({ state: 2, time: 90.3 })).seekTo, undefined, "already close enough, and nothing more to do");
});

test("the host resuming resumes the guest", () => {
  const plan = planFollow(song({ playing: true }), 1_000_500, seen({ playing: false }), live({ state: 2, time: 60 }));
  assert.equal(plan.play, true);
  assert.equal(plan.seen.playing, true);
});

test("a new track in a playlist moves the guest to it, and waits to line up the place", () => {
  const list = song({ kind: "playlist", index: 4 });
  const plan = planFollow(list, 1_001_000, seen({ index: 1 }), live({ index: 1, time: 3 }));
  assert.equal(plan.goToTrack, 4);
  assert.equal(plan.seen.index, 4);
  assert.equal(plan.seekTo, undefined, "the old track's clock says nothing about the new one");
  // once the guest is on the right track, the place is followed as usual
  assert.equal(planFollow(list, 1_001_000, plan.seen, live({ index: 4, time: 5 })).seekTo, 61);
  // a guest still on another track is not seeked into the wrong video
  assert.equal(planFollow(list, 1_001_000, plan.seen, live({ index: 2, time: 5 })).seekTo, undefined);
});

test("a single video has no tracks to change", () => {
  assert.equal(planFollow(song({ index: 7 }), 1_001_000, seen(), live({ time: 61 })).goToTrack, undefined);
});

test("a stale report is not followed while the host is playing", () => {
  assert.equal(planFollow(song(), 1_090_000, seen(), live({ time: 1 })).seekTo, undefined);
});

test("the host's page notices a seek, a pause, a play and a new track, but not normal playing", () => {
  const was = { time: 100, playing: true, index: 0 };
  assert.equal(hostMoved(was, { time: 100.5, playing: true, index: 0 }, 0.5), false, "just playing");
  assert.equal(hostMoved(was, { time: 101.2, playing: true, index: 0 }, 0.5), false, "a little timer slack");
  assert.equal(hostMoved(was, { time: 160, playing: true, index: 0 }, 0.5), true, "fast-forward");
  assert.equal(hostMoved(was, { time: 20, playing: true, index: 0 }, 0.5), true, "rewind");
  assert.equal(hostMoved(was, { time: 100.5, playing: false, index: 0 }, 0.5), true, "pause");
  assert.equal(hostMoved({ ...was, playing: false }, { time: 100, playing: true, index: 0 }, 0.5), true, "play");
  assert.equal(hostMoved({ ...was, playing: false }, { time: 100.2, playing: false, index: 0 }, 0.5), false, "still paused");
  assert.equal(hostMoved({ ...was, playing: false }, { time: 130, playing: false, index: 0 }, 0.5), true, "scrubbing while paused");
  assert.equal(hostMoved(was, { time: 0, playing: true, index: 1 }, 0.5), true, "next track");
});
