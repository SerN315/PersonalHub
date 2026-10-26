import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIDE, PHASES, ROADMAP, SCORECARD, computeProgress, monthsLabel, remainingWeeks, type RoadmapItem } from "./content.ts";

test("progress is the weighted share of the roadmap that is finished", () => {
  const items: RoadmapItem[] = [
    { id: "a", title: "a", status: "done", progress: 1, weight: 3, text: "" },
    { id: "b", title: "b", status: "building", progress: 0.5, weight: 2, text: "" },
    { id: "c", title: "c", status: "next", progress: 0, weight: 5, text: "" },
  ];
  const result = computeProgress(items);
  assert.equal(result.total, 10);
  assert.equal(result.done, 4);
  assert.equal(result.percent, 40);
  assert.deepEqual(result.counts, { done: 1, building: 1, next: 1, later: 0 });
});

test("progress cannot go below 0 or above 100, and an empty roadmap is 0", () => {
  const wild: RoadmapItem[] = [{ id: "a", title: "a", status: "done", progress: 7, weight: 1, text: "" }, { id: "b", title: "b", status: "next", progress: -3, weight: 1, text: "" }];
  assert.equal(computeProgress(wild).percent, 50);
  assert.equal(computeProgress([]).percent, 0);
});

test("every roadmap item is well formed and its status agrees with how far along it is", () => {
  const ids = new Set<string>();
  for (const item of ROADMAP) {
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    assert.ok(item.weight > 0 && item.text.length > 10 && item.title.length > 2, item.id);
    assert.ok(item.progress >= 0 && item.progress <= 1, item.id);
    if (item.status === "done") assert.equal(item.progress, 1, `${item.id} is "done" so it should be 100%`);
    if (item.status === "next" || item.status === "later") assert.equal(item.progress, 0, `${item.id} has not started`);
    if (item.status === "building") assert.ok(item.progress > 0 && item.progress < 1, item.id);
  }
});

test("every unfinished item is in exactly one phase, and no phase names an unknown or finished item", () => {
  const byId = new Map(ROADMAP.map((item) => [item.id, item]));
  const planned = PHASES.flatMap((phase) => phase.items);
  for (const id of planned) {
    assert.ok(byId.has(id), `phase mentions unknown item ${id}`);
    assert.notEqual(byId.get(id)!.status, "done", `${id} is finished but still planned`);
  }
  assert.equal(new Set(planned).size, planned.length, "an item is in two phases");
  const unfinished = ROADMAP.filter((item) => item.status !== "done").map((item) => item.id).sort();
  assert.deepEqual([...planned].sort(), unfinished);
  for (const phase of PHASES) assert.ok(phase.weeks[0] > 0 && phase.weeks[0] <= phase.weeks[1], phase.name);
});

test("the time left adds up, and skipping a phase shortens it", () => {
  const all = remainingWeeks();
  assert.equal(all.min, PHASES.reduce((sum, p) => sum + p.weeks[0], 0));
  const withoutApps = remainingWeeks(PHASES, ["apps"]);
  assert.ok(withoutApps.max < all.max && withoutApps.min < all.min);
});

test("durations read naturally", () => {
  assert.equal(monthsLabel(2), "2 weeks");
  assert.equal(monthsLabel(13), "3 months");
  assert.equal(monthsLabel(34), "8 months");
});

test("every guide section says what it is and why it exists, and the scorecard is in range", () => {
  const ids = new Set<string>();
  for (const section of GUIDE) {
    assert.ok(!ids.has(section.id));
    ids.add(section.id);
    assert.ok(section.what.length > 20 && section.why.length > 20 && section.tips.length > 0, section.id);
    if (section.href) assert.ok(section.href.startsWith("/") && section.open, section.id);
    for (const part of section.parts ?? []) assert.ok(part.name && part.text.length > 10);
  }
  for (const row of SCORECARD) assert.ok(row.score >= 0 && row.score <= 10 && row.note.length > 10, row.name);
});

test("the headline number is what the roadmap says today", () => {
  const { percent } = computeProgress();
  assert.ok(percent >= 40 && percent <= 70, `unexpected ${percent}%`);
});
