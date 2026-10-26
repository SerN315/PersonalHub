import { test } from "node:test";
import assert from "node:assert/strict";
import { dialNumber, indexFor, parsePlaylistId, parseYouTubeLink, playlistName, needsName, titleWithAuthor, positionFor, sanitizeFavorites, sanitizePlaylists, sanitizeStation, stepIndex, toggleFavorite, MAX_FAVORITES } from "./radioData.ts";

const UUID = "9617a958-0601-11e8-ae97-52543be04c81";
const station = (over: Record<string, unknown> = {}) => ({ id: UUID, name: "Chill FM", url: "https://stream.example/chill.mp3", country: "Vietnam", countryCode: "VN", tags: ["chill"], codec: "MP3", bitrate: 128, votes: 9, ...over });

test("playlist links: every YouTube and YouTube Music form is understood", () => {
  const id = "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";
  for (const input of [
    id,
    `https://www.youtube.com/playlist?list=${id}`,
    `https://music.youtube.com/playlist?list=${id}`,
    `https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${id}&index=3`,
    `https://youtu.be/dQw4w9WgXcQ?list=${id}`,
    `youtube.com/playlist?list=${id}`,
    `  https://m.youtube.com/playlist?list=${id}  `,
    `https://music.youtube.com/watch?v=abc&list=${id}`,
  ]) assert.equal(parsePlaylistId(input), id, input);
  assert.equal(parsePlaylistId("https://music.youtube.com/playlist?list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs"), "RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs");
});

test("playlist links: anything else is rejected", () => {
  for (const input of ["", "   ", "hello", "javascript:alert(1)", "https://evil.example/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", "https://youtube.com.evil.example/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/playlist?list=short", "https://www.youtube.com/playlist?list=" + "a".repeat(80), "https://user:pw@www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", "ftp://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", "x".repeat(400), "PL rAXtmErZgOeiKm4", "<script>"]) {
    assert.equal(parsePlaylistId(input), null, input.slice(0, 60));
  }
});

test("saved stations: restored only when they are complete and safe", () => {
  assert.deepEqual(sanitizeStation(station()), { ...station(), votes: 0 });
  for (const bad of [null, undefined, "x", 5, [], {}, station({ id: "nope" }), station({ url: "http://plain.example/s" }), station({ url: "javascript:alert(1)" }), station({ url: "https://a b" }), station({ name: "   " }), station({ url: "https://x.example/" + "a".repeat(600) })]) {
    assert.equal(sanitizeStation(bad), null, JSON.stringify(bad)?.slice(0, 60));
  }
});

test("saved stations: text is cleaned, lists are capped and de-duplicated", () => {
  const cleaned = sanitizeStation(station({ name: "Hits\u0000\u0007 " + "x".repeat(200), tags: ["a".repeat(60), 5, null, "ok"], bitrate: 99999, countryCode: "vn" }))!;
  assert.ok(cleaned.name.length <= 80 && !/[\u0000-\u001f]/.test(cleaned.name));
  assert.deepEqual(cleaned.tags.map((t) => t.length <= 24), cleaned.tags.map(() => true));
  assert.equal(cleaned.bitrate, 1000);
  assert.equal(cleaned.countryCode, "", "lower-case codes are dropped rather than trusted");
  const many = Array.from({ length: 60 }, (_, i) => station({ id: `9617a958-0601-11e8-ae97-52543be04${String(i).padStart(3, "0")}` }));
  assert.equal(sanitizeFavorites(many).length, MAX_FAVORITES);
  assert.equal(sanitizeFavorites([station(), station(), station()]).length, 1, "the same station twice becomes one");
  assert.deepEqual(sanitizeFavorites("nope"), []);
});

test("saved playlists: only valid ids survive, an unnamed one stays unnamed", () => {
  assert.deepEqual(sanitizePlaylists([{ id: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", label: "  Study  beats " }, { id: "bad id" }, { id: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf" }, { id: "RDCLAK5uy_kmPRjHDEC" }, null, 7]), [
    { id: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", label: "Study beats" },
    { id: "RDCLAK5uy_kmPRjHDEC", label: "" },
  ]);
  assert.equal(sanitizePlaylists(Array.from({ length: 30 }, (_, i) => ({ id: `PLabcdefghij${String(i).padStart(2, "0")}` }))).length, 10);
});

test("favourites toggle on and off, and the oldest makes room at the limit", () => {
  const a = sanitizeStation(station())!;
  const b = sanitizeStation(station({ id: "96202c78-0601-11e8-ae97-52543be04c81" }))!;
  assert.deepEqual(toggleFavorite([], a), [a]);
  assert.deepEqual(toggleFavorite([a], a), []);
  assert.deepEqual(toggleFavorite([a], b), [a, b]);
  const full = Array.from({ length: MAX_FAVORITES }, (_, i) => ({ ...a, id: `9617a958-0601-11e8-ae97-52543be04${String(i).padStart(3, "0")}` }));
  const next = toggleFavorite(full, b);
  assert.equal(next.length, MAX_FAVORITES);
  assert.equal(next.at(-1), b);
  assert.notEqual(next[0], full[0]);
});

test("the dial: positions and indexes agree, and stepping wraps round", () => {
  for (const count of [2, 3, 7, 30]) for (let i = 0; i < count; i++) assert.equal(indexFor(positionFor(i, count), count), i, `${i}/${count}`);
  assert.equal(positionFor(0, 1), 0);
  assert.equal(positionFor(3, 0), 0);
  assert.equal(positionFor(-1, 5), 0);
  assert.equal(indexFor(0, 0), -1);
  assert.equal(indexFor(-5, 4), 0);
  assert.equal(indexFor(5, 4), 3);
  assert.equal(stepIndex(5, 4, 1), 0);
  assert.equal(stepIndex(5, 0, -1), 4);
  assert.equal(stepIndex(5, -1, 1), 0);
  assert.equal(stepIndex(5, -1, -1), 4);
  assert.equal(stepIndex(0, -1, 1), -1);
  assert.equal(dialNumber(0), "88.0");
  assert.equal(dialNumber(1), "108.0");
  assert.equal(dialNumber(0.5), "98.0");
  assert.equal(dialNumber(7), "108.0");
});

test("YouTube links: one video, a playlist, or a bare id, from every kind of link", () => {
  const video = { kind: "video", ref: "dQw4w9WgXcQ" };
  const id = "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";
  for (const input of ["dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube.com/watch?v=dQw4w9WgXcQ&t=40s", "https://youtu.be/dQw4w9WgXcQ?si=abc", "https://music.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ", `https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${id}`, "  https://m.youtube.com/watch?v=dQw4w9WgXcQ  "]) {
    assert.deepEqual(parseYouTubeLink(input), video, input);
  }
  for (const input of [id, `https://www.youtube.com/playlist?list=${id}`, `https://music.youtube.com/playlist?list=${id}`]) assert.deepEqual(parseYouTubeLink(input), { kind: "playlist", ref: id }, input);
});

test("YouTube links: anything else is rejected", () => {
  for (const input of ["", "hello world", "javascript:alert(1)", "https://evil.example/watch?v=dQw4w9WgXcQ", "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/watch?v=short", "https://www.youtube.com/watch", "https://user:pw@www.youtube.com/watch?v=dQw4w9WgXcQ", "ftp://www.youtube.com/watch?v=dQw4w9WgXcQ", "x".repeat(400), "<script>", "https://www.youtube.com/watch?v=dQw4w9WgXc\"><b"]) {
    assert.equal(parseYouTubeLink(input), null, input.slice(0, 60));
  }
});

test("saved playlists and songs: the kind, title and channel survive; junk does not", () => {
  const id = "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";
  const saved = sanitizePlaylists([
    { id, label: "  Study  ", kind: "playlist", title: "Beats", author: "Chan" },
    { id: "dQw4w9WgXcQ", label: "", kind: "video", title: "A song", author: "An artist" },
    { id: "abcdefghijk", label: "x", kind: "nonsense", title: 5, author: "orphan" },
  ]);
  assert.deepEqual(saved[0], { id, label: "Study", title: "Beats", author: "Chan" });
  assert.deepEqual(saved[1], { id: "dQw4w9WgXcQ", label: "", kind: "video", title: "A song", author: "An artist" });
  assert.deepEqual(saved[2], { id: "abcdefghijk", label: "x" }, "an unknown kind is a playlist, and a channel without a title is dropped");
});

test("names: yours first, then YouTube's title - channel, then a plain word", () => {
  assert.equal(playlistName({ id: "x", label: "My mix", title: "T", author: "A" }), "My mix");
  assert.equal(playlistName({ id: "x", label: "", title: "T", author: "A" }), "T - A");
  assert.equal(playlistName({ id: "x", label: "", title: "T" }), "T");
  assert.equal(playlistName({ id: "x", label: "My playlist", title: "T", author: "A" }), "T - A", "the old automatic name gives way to the real title");
  assert.equal(playlistName({ id: "x", label: "" }), "YouTube playlist");
  assert.equal(playlistName({ id: "x", label: "", kind: "video" }), "YouTube song");
  assert.equal(titleWithAuthor(null, "A"), "");
  assert.equal(needsName({ id: "x", label: "" }), true);
  assert.equal(needsName({ id: "x", label: "My playlist" }), true);
  assert.equal(needsName({ id: "x", label: "Mine" }), false);
  assert.equal(needsName({ id: "x", label: "", title: "T" }), false);
});
