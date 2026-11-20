import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { NotificationItem } from "../../apis/notifications.ts";
import { DEFAULT_PREFS, cleanPrefs, groupNew, mergeItems, planAlert, pollDelay, timeAgo, titleWithCount, toAnnounce, whereTo } from "./alert.ts";

const item = (seq: number, extra: Partial<NotificationItem> = {}): NotificationItem => ({ id: `id${seq}`, seq, source: "webhook", label: null, title: `t${seq}`, body: null, link: null, read: false, created_at: "2026-01-01T00:00:00Z", ...extra });

describe("planAlert", () => {
  const on = { popup: true, sound: true, desktop: true };
  it("looking at the page: a card and the chime, never a message from the computer", () => {
    assert.deepEqual(planAlert(on, "focused", "granted"), { toast: true, sound: true, desktop: false });
  });
  it("page in the background: the computer's own message and the chime, no card", () => {
    assert.deepEqual(planAlert(on, "background", "granted"), { toast: false, sound: true, desktop: true });
  });
  it("the computer's message needs both the choice and the browser's permission", () => {
    for (const permission of ["denied", "default", "unsupported"] as const) assert.equal(planAlert(on, "background", permission).desktop, false);
    assert.equal(planAlert({ ...on, desktop: false }, "background", "granted").desktop, false);
  });
  it("each part can be switched off", () => {
    assert.deepEqual(planAlert({ popup: false, sound: false, desktop: false }, "focused", "granted"), { toast: false, sound: false, desktop: false });
  });
});

describe("cleanPrefs", () => {
  it("fills in what is missing and ignores what is not a yes or no", () => {
    assert.deepEqual(cleanPrefs(null), DEFAULT_PREFS);
    assert.deepEqual(cleanPrefs({ popup: "no", sound: false, desktop: 1 }), { popup: true, sound: false, desktop: false });
  });
});

describe("groupNew", () => {
  it("leaves a few alone and folds a flood into one", () => {
    const few = [item(3), item(2), item(1)];
    assert.equal(groupNew(few), few);
    const many = groupNew([item(5), item(4), item(3), item(2), item(1)]);
    assert.equal(many.length, 1);
    assert.equal(many[0].title, "5 new notifications");
    assert.equal(many[0].body, "t5");
  });
});

describe("toAnnounce", () => {
  it("skips what is read, already known, or announced before", () => {
    const arrived = [item(4), item(3, { read: true }), item(2), item(1)];
    assert.deepEqual(toAnnounce(arrived, new Set(["id2"]), 0).map((n) => n.seq), [4, 1]);
    assert.deepEqual(toAnnounce(arrived, new Set(), 3).map((n) => n.seq), [4]);
  });
});

describe("mergeItems", () => {
  it("adds without repeats, newest first, and keeps no more than the most", () => {
    const merged = mergeItems([item(2), item(1)], [item(3), item(2, { read: true })]);
    assert.deepEqual(merged.map((n) => [n.seq, n.read]), [[3, false], [2, true], [1, false]]);
    assert.equal(mergeItems([item(3), item(2), item(1)], [item(4)], 3).length, 3);
  });
  it("returns the very same list when nothing arrived (so nothing redraws)", () => {
    const list = [item(1)];
    assert.equal(mergeItems(list, []), list);
  });
});

describe("pollDelay", () => {
  it("is quick when looked at, slow when hidden, and backs off after failures up to a limit", () => {
    assert.equal(pollDelay("focused", 0), 20_000);
    assert.ok(pollDelay("hidden", 0) > pollDelay("background", 0));
    assert.equal(pollDelay("focused", 2), 80_000);
    assert.equal(pollDelay("hidden", 9), 300_000);
  });
});

describe("titleWithCount", () => {
  it("puts the count in front, replaces an old one and never grows without end", () => {
    assert.equal(titleWithCount("PersonalHub", 3), "(3) PersonalHub");
    assert.equal(titleWithCount("(3) PersonalHub", 5), "(5) PersonalHub");
    assert.equal(titleWithCount("(3) PersonalHub", 0), "PersonalHub");
    assert.equal(titleWithCount("PersonalHub", 250), "(99+) PersonalHub");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-06-10T12:00:00Z");
  it("says it in plain words", () => {
    assert.equal(timeAgo(now - 10_000, now), "just now");
    assert.equal(timeAgo(now - 5 * 60_000, now), "5 min ago");
    assert.equal(timeAgo(now - 3 * 3_600_000, now), "3 hours ago");
    assert.equal(timeAgo(now - 86_400_000, now), "yesterday");
    assert.equal(timeAgo(now - 4 * 86_400_000, now), "4 days ago");
    assert.equal(timeAgo(now + 5000, now), "just now");
  });
});

describe("whereTo", () => {
  it("follows places inside the app and secure addresses only", () => {
    assert.deepEqual(whereTo("/radio"), { kind: "app", path: "/radio" });
    assert.deepEqual(whereTo("https://example.com/x"), { kind: "web", url: "https://example.com/x" });
    for (const bad of ["javascript:alert(1)", "http://example.com", "//evil.example", "/\\evil", "", null]) assert.equal(whereTo(bad), null, String(bad));
  });
});
