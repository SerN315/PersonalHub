import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CLOCKS, ZONES, cleanZones, differenceLabel, timeIn, zoneOffsetMinutes } from "./clocks.ts";

const WINTER = new Date("2026-01-15T12:00:00Z");
const SUMMER = new Date("2026-07-15T12:00:00Z");

test("offsets follow daylight saving", () => {
  assert.equal(zoneOffsetMinutes("UTC", WINTER), 0);
  assert.equal(zoneOffsetMinutes("Asia/Ho_Chi_Minh", WINTER), 420);
  assert.equal(zoneOffsetMinutes("Asia/Kolkata", SUMMER), 330);
  assert.equal(zoneOffsetMinutes("America/New_York", WINTER), -300);
  assert.equal(zoneOffsetMinutes("America/New_York", SUMMER), -240);
  assert.equal(zoneOffsetMinutes("Europe/London", SUMMER), 60);
  assert.equal(zoneOffsetMinutes("Australia/Sydney", WINTER), 660);
  assert.equal(zoneOffsetMinutes("Australia/Sydney", SUMMER), 600);
});

test("every zone on the list is one this browser knows", () => {
  for (const zone of ZONES) assert.doesNotThrow(() => zoneOffsetMinutes(zone.tz, WINTER), zone.tz);
  assert.equal(new Set(ZONES.map((z) => z.tz)).size, ZONES.length, "no zone twice");
});

test("the difference reads in plain words", () => {
  assert.equal(differenceLabel("Asia/Ho_Chi_Minh", WINTER, 420), "same time as you");
  assert.equal(differenceLabel("Europe/Paris", WINTER, 420), "6 hours behind");
  assert.equal(differenceLabel("Asia/Kolkata", WINTER, 420), "1 hour 30 minutes behind");
  assert.equal(differenceLabel("Asia/Tokyo", WINTER, 420), "2 hours ahead");
  assert.equal(differenceLabel("Asia/Kolkata", WINTER, 0), "5 hours 30 minutes ahead");
});

test("the time and whether it is day there", () => {
  const noonUtc = new Date("2026-03-10T12:00:00Z");
  assert.equal(timeIn("Asia/Tokyo", noonUtc).weekday, "Tue");
  assert.equal(timeIn("Asia/Tokyo", noonUtc).daytime, false, "9pm in Tokyo");
  assert.equal(timeIn("UTC", noonUtc).daytime, true);
});

test("saved clocks are cleaned: only known zones, no repeats, at most six", () => {
  assert.deepEqual(cleanZones(null), []);
  assert.deepEqual(cleanZones("Asia/Tokyo"), []);
  assert.deepEqual(cleanZones(["Asia/Tokyo", "Asia/Tokyo", "Mars/Olympus", 5, { tz: "Asia/Seoul" }, "Asia/Seoul"]).map((z) => z.tz), ["Asia/Tokyo", "Asia/Seoul"]);
  assert.equal(cleanZones(ZONES.map((z) => z.tz)).length, MAX_CLOCKS);
});
