import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuickAdd } from "./quickAdd.ts";

const TODAY = "2026-10-21"; // a Wednesday
const lists = [{ id: "list-home", name: "Home" }, { id: "list-work", name: "Work stuff" }];
const parse = (input: string) => parseQuickAdd(input, { today: TODAY, lists });
const pick = (input: string) => {
  const p = parse(input);
  return { text: p.text, date: p.due_date, time: p.due_time };
};

test("plain text stays plain", () => {
  assert.deepEqual(pick("buy milk"), { text: "buy milk", date: null, time: null });
  const p = parse("  buy   milk  ");
  assert.equal(p.text, "buy milk");
  assert.equal(p.priority, 0);
  assert.deepEqual(p.tags, []);
  assert.equal(p.repeat, null);
});

test("relative days", () => {
  assert.deepEqual(pick("call mom today"), { text: "call mom", date: "2026-10-21", time: null });
  assert.deepEqual(pick("call mom tomorrow"), { text: "call mom", date: "2026-10-22", time: null });
  assert.deepEqual(pick("call mom tmr"), { text: "call mom", date: "2026-10-22", time: null });
  assert.deepEqual(pick("report in 3 days"), { text: "report", date: "2026-10-24", time: null });
  assert.deepEqual(pick("report in 2 weeks"), { text: "report", date: "2026-11-04", time: null });
  assert.deepEqual(pick("report in 1 month"), { text: "report", date: "2026-11-21", time: null });
  assert.deepEqual(pick("review next week"), { text: "review", date: "2026-10-28", time: null });
  assert.deepEqual(pick("review next month"), { text: "review", date: "2026-11-21", time: null });
  assert.deepEqual(pick("by tomorrow submit"), { text: "submit", date: "2026-10-22", time: null }, "a leading 'by' goes with the date");
});

test("weekdays mean the NEXT one (never today), with or without next/this/on", () => {
  assert.equal(parse("gym friday").due_date, "2026-10-23");
  assert.equal(parse("gym on friday").due_date, "2026-10-23");
  assert.equal(parse("gym next friday").due_date, "2026-10-23");
  assert.equal(parse("gym this friday").due_date, "2026-10-23");
  assert.equal(parse("gym wednesday").due_date, "2026-10-28", "today is Wednesday: next Wednesday is a week away");
  assert.equal(parse("gym monday").due_date, "2026-10-26");
  assert.equal(parse("gym on mon").due_date, "2026-10-26");
  assert.equal(parse("gym next sat").due_date, "2026-10-24");
});

test("calendar dates, in either order, rolling to next year when already past", () => {
  assert.deepEqual(pick("party oct 25"), { text: "party", date: "2026-10-25", time: null });
  assert.deepEqual(pick("party 25 oct"), { text: "party", date: "2026-10-25", time: null });
  assert.deepEqual(pick("party october 25th"), { text: "party", date: "2026-10-25", time: null });
  assert.deepEqual(pick("party on 3rd dec"), { text: "party", date: "2026-12-03", time: null });
  assert.deepEqual(pick("renew jan 5"), { text: "renew", date: "2027-01-05", time: null }, "January 5 has already gone this year");
  assert.deepEqual(pick("renew oct 21"), { text: "renew", date: "2026-10-21", time: null }, "today itself is not 'past'");
  assert.deepEqual(pick("renew oct 20"), { text: "renew", date: "2027-10-20", time: null });
  assert.deepEqual(pick("launch 2027-03-09"), { text: "launch", date: "2027-03-09", time: null });
});

test("impossible dates are left as text", () => {
  assert.deepEqual(pick("deadline feb 30"), { text: "deadline feb 30", date: null, time: null });
  assert.deepEqual(pick("deadline 31 apr"), { text: "deadline 31 apr", date: null, time: null });
  assert.deepEqual(pick("x 2027-02-29"), { text: "x 2027-02-29", date: null, time: null });
});

test("times", () => {
  assert.deepEqual(pick("dentist 5pm"), { text: "dentist", date: "2026-10-21", time: "17:00" });
  assert.deepEqual(pick("dentist at 5:30pm"), { text: "dentist", date: "2026-10-21", time: "17:30" });
  assert.deepEqual(pick("dentist 12am"), { text: "dentist", date: "2026-10-21", time: "00:00" });
  assert.deepEqual(pick("dentist 12pm"), { text: "dentist", date: "2026-10-21", time: "12:00" });
  assert.deepEqual(pick("dentist 17:45"), { text: "dentist", date: "2026-10-21", time: "17:45" });
  assert.deepEqual(pick("dentist at noon"), { text: "dentist", date: "2026-10-21", time: "12:00" });
  assert.deepEqual(pick("dentist friday 9am"), { text: "dentist", date: "2026-10-23", time: "09:00" });
  assert.deepEqual(pick("9am standup tomorrow"), { text: "standup", date: "2026-10-22", time: "09:00" });
  assert.deepEqual(pick("dentist 13pm"), { text: "dentist 13pm", date: null, time: null }, "13pm is not a time");
  assert.deepEqual(pick("room 24:30"), { text: "room 24:30", date: null, time: null });
});

test("priority, tags and lists", () => {
  const p = parse("pay rent !high #home #money @home");
  assert.deepEqual([p.text, p.priority, p.tags, p.listId], ["pay rent", 3, ["home", "money"], "list-home"]);
  assert.equal(parse("x !1").priority, 1);
  assert.equal(parse("x !med").priority, 2);
  assert.equal(parse("x !2").priority, 2);
  assert.equal(parse("x !low").priority, 1);
  assert.equal(parse("report @work-stuff").listId, "list-work", "a list with a space in its name is written with a dash");
  assert.deepEqual(parse("report @nowhere"), { ...parse("report @nowhere"), text: "report @nowhere", listId: null }, "an unknown list stays as text");
  assert.deepEqual(parse("x #a #A #a").tags, ["a"], "the same tag twice is one tag");
  assert.equal(parse("x " + Array.from({ length: 12 }, (_, i) => `#t${i}`).join(" ")).tags.length, 8, "at most 8 tags");
  assert.equal(parse("buy c# book").text, "buy c# book", "# inside a word is not a tag");
  assert.equal(parse("wow! really").priority, 0, "an exclamation mark is not a priority");
});

test("repeating", () => {
  const rule = (s: string) => parse(s).repeat;
  assert.deepEqual(rule("water plants every day"), { every: 1, unit: "day" });
  assert.deepEqual(rule("water plants daily"), { every: 1, unit: "day" });
  assert.deepEqual(rule("clean every week"), { every: 1, unit: "week" });
  assert.deepEqual(rule("clean every other week"), { every: 2, unit: "week" });
  assert.deepEqual(rule("clean every 3 days"), { every: 3, unit: "day" });
  assert.deepEqual(rule("rent every month"), { every: 1, unit: "month" });
  assert.deepEqual(rule("rent monthly"), { every: 1, unit: "month" });
  assert.deepEqual(rule("checkup every year"), { every: 1, unit: "year" });
  assert.deepEqual(rule("standup every weekday"), { every: 1, unit: "weekday" });
  assert.deepEqual(rule("standup every weekdays"), { every: 1, unit: "weekday" });
  assert.deepEqual(rule("gym every monday"), { every: 1, unit: "week" });
  assert.equal(parse("gym every monday").due_date, "2026-10-26", "and it starts on the next Monday");
  assert.equal(parse("gym every monday").text, "gym");
  assert.equal(parse("rent every month").due_date, "2026-10-21", "a repeat with no date starts today");
  assert.equal(parse("rent every month on oct 31").due_date, "2026-10-31");
  assert.equal(parse("x every 0 days").repeat, null);
});

test("it does not swallow ordinary words", () => {
  for (const sentence of ["may I come", "apply sun cream", "plan today's meeting", "sat nav update", "the monday meeting notes", "order 5 apples", "call 2nd cousin", "read chapter 5", "tom and jerry", "call Tom tod", "fix the noon bug report", "march forward"]) {
    const p = parse(sentence);
    assert.equal(p.due_time, null, sentence + " (time)");
    if (!/monday/.test(sentence)) assert.equal(p.due_date, null, sentence + " (date)"); // a bare "monday" IS a date: that is the feature
  }
  assert.equal(parse("may I come").text, "may I come");
  assert.equal(parse("apply sun cream").text, "apply sun cream");
  assert.equal(parse("plan today's meeting").text, "plan today's meeting");
});

test("a sentence that is only a date is a task with that name", () => {
  assert.deepEqual(pick("tomorrow"), { text: "tomorrow", date: null, time: null });
  assert.deepEqual(pick("5pm"), { text: "5pm", date: null, time: null });
  assert.deepEqual(pick("#home"), { text: "#home", date: null, time: null });
  assert.deepEqual(pick(""), { text: "", date: null, time: null });
  assert.deepEqual(pick("   "), { text: "", date: null, time: null });
});

test("everything together, with chips for the preview", () => {
  const p = parse("pay rent friday 5pm !high #home every month");
  assert.equal(p.text, "pay rent");
  assert.equal(p.due_date, "2026-10-23");
  assert.equal(p.due_time, "17:00");
  assert.equal(p.priority, 3);
  assert.deepEqual(p.tags, ["home"]);
  assert.deepEqual(p.repeat, { every: 1, unit: "month" });
  assert.deepEqual(p.chips.map((c) => c.kind).sort(), ["date", "priority", "repeat", "tag", "time"]);
});

test("hostile input is just text", () => {
  for (const input of ["<script>alert(1)</script> tomorrow", "'); DROP TABLE todos; -- friday", "a".repeat(5000) + " tomorrow", "!!!!!! ###### @@@@@@ every every every"]) {
    const p = parse(input);
    assert.equal(typeof p.text, "string");
    assert.ok(p.chips.length <= 12);
  }
  assert.equal(parse("<b>x</b> tomorrow").text, "<b>x</b>", "markup is never interpreted here; the page shows text as text");
});
