import { test } from "node:test";
import assert from "node:assert/strict";
import { countWords, inline, parse, safeUrl, toggleTask, type Block, type Inline } from "./markdown.ts";

const text = (nodes: Inline[]): string => nodes.map((n) => (n.t === "text" || n.t === "code" ? n.v : n.t === "bold" || n.t === "italic" || n.t === "link" ? text(n.c) : "")).join("");
const kinds = (blocks: Block[]) => blocks.map((b) => b.t);

test("blocks: headings, paragraphs, quotes, rules", () => {
  const blocks = parse("# Title\n\nSome words\non two lines\n\n## Sub\n> a quote\n---\n### Small");
  assert.deepEqual(kinds(blocks), ["heading", "p", "heading", "quote", "hr", "heading"]);
  assert.deepEqual(blocks.filter((b) => b.t === "heading").map((b) => (b as { level: number }).level), [1, 2, 3]);
  assert.equal(text((blocks[1] as { c: Inline[] }).c), "Some words\non two lines", "line breaks inside a paragraph are kept");
});

test("a # with no space, or four of them, is just text", () => {
  assert.deepEqual(kinds(parse("#hashtag")), ["p"]);
  assert.deepEqual(kinds(parse("#### four")), ["p"]);
});

test("lists group together, and remember which line each item came from", () => {
  const blocks = parse("intro\n- one\n- two\n1. first\n2. second\n- [ ] todo\n- [x] done\n- [X] also done");
  assert.deepEqual(kinds(blocks), ["p", "ul", "ol", "tasks"]);
  const tasks = blocks[3] as { items: { line: number; checked?: boolean }[] };
  assert.deepEqual(tasks.items.map((i) => [i.line, i.checked]), [[5, false], [6, true], [7, true]]);
  assert.equal((blocks[1] as { items: unknown[] }).items.length, 2);
});

test("ticking a box changes only that line", () => {
  const body = "- [ ] a\n- [x] b\ntext [ ] not a task\n  * [ ] indented";
  assert.equal(toggleTask(body, 0), "- [x] a\n- [x] b\ntext [ ] not a task\n  * [ ] indented");
  assert.equal(toggleTask(body, 1), "- [ ] a\n- [ ] b\ntext [ ] not a task\n  * [ ] indented");
  assert.equal(toggleTask(body, 3), "- [ ] a\n- [x] b\ntext [ ] not a task\n  * [x] indented");
  assert.equal(toggleTask(body, 2), body, "a line that is not a task is left alone");
  assert.equal(toggleTask(body, 99), body);
  assert.equal(toggleTask(toggleTask(body, 0), 0), body, "toggling twice is a round trip");
});

test("inline: bold, italic, code and nesting", () => {
  const nodes = inline("a **bold *and italic*** b `**not bold**` _soft_");
  assert.deepEqual(nodes.map((n) => n.t), ["text", "bold", "text", "code", "text", "italic"]);
  assert.equal((nodes[3] as { v: string }).v, "**not bold**", "code is literal");
});

test("snake_case_words and 2 * 3 * 4 are not turned into italics", () => {
  assert.deepEqual(inline("use snake_case_names here"), [{ t: "text", v: "use snake_case_names here" }]);
  assert.deepEqual(inline("2 * 3 * 4"), [{ t: "text", v: "2 * 3 * 4" }]);
});

test("unmatched markers stay as text", () => {
  assert.equal(text(inline("a ** b")), "a ** b");
  assert.equal(text(inline("a `b")), "a `b");
  assert.equal(text(inline("[x](https://a.test")), "[x](https://a.test");
});

test("links: only http and https, and a full stop after one is not part of it", () => {
  assert.deepEqual(inline("[site](https://example.com/a?b=1)"), [{ t: "link", href: "https://example.com/a?b=1", c: [{ t: "text", v: "site" }] }]);
  const bare = inline("see https://example.com/page. Then http://a.test/x, ok");
  assert.deepEqual(bare.filter((n) => n.t === "link").map((n) => (n as { href: string }).href), ["https://example.com/page", "http://a.test/x"]);
  assert.equal(text(bare), "see https://example.com/page. Then http://a.test/x, ok");
});

test("dangerous links are never links", () => {
  for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:x", "file:///etc/passwd", "//evil.test", "https://user:pass@evil.test/", "https://", "ftp://x.test", "https://a.test/<b>", "https://a.test/x"]) {
    assert.equal(safeUrl(bad), null, bad);
    assert.ok(!inline(`[click](${bad})`).some((n) => n.t === "link"), bad);
  }
  assert.equal(safeUrl("https://example.com"), "https://example.com/");
  assert.equal(safeUrl("https://" + "a".repeat(3000) + ".test"), null);
});

test("html is only ever text", () => {
  const blocks = parse('<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n**<b>bold</b>**');
  const all = JSON.stringify(blocks);
  assert.ok(all.includes("<script>alert(1)</script>"), "kept as text for the page to show");
  assert.deepEqual(kinds(blocks), ["p"]);
  assert.ok(!all.includes('"t":"html"'));
});

test("hostile input is fast and cannot nest forever", () => {
  const started = Date.now();
  const nasty = ["*".repeat(50_000), "[".repeat(20_000), "[a](".repeat(5_000), "**a ".repeat(10_000), "_".repeat(30_000), "`".repeat(30_000), "http://".repeat(5_000)];
  for (const input of nasty) parse(input);
  const deep = "**a *b **c *d **e *f **g***********";
  const depth = (nodes: Inline[]): number => Math.max(0, ...nodes.map((n) => (n.t === "bold" || n.t === "italic" || n.t === "link" ? 1 + depth(n.c) : 0)));
  assert.ok(depth(inline(deep)) <= 3 + 1);
  assert.ok(Date.now() - started < 2000, `took ${Date.now() - started} ms`);
});

test("word count", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   \n  "), 0);
  assert.equal(countWords("one two\nthree"), 3);
});
