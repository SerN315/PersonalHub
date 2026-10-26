// A small, SAFE subset of Markdown for notes. The text is parsed into plain data (never into HTML), and the page turns that data into
// elements, so anything written in a note, including "<script>", can only ever appear as text. Links are only ever http or https.
//
// Supported: # ## ### headings, - * bullets, 1. numbered lists, - [ ] / - [x] tick-boxes, > quotes, --- lines,
// **bold**, *italic* or _italic_, `code`, [text](https://link) and bare https:// links.

export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; c: Inline[] }
  | { t: "italic"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] };

export interface Item {
  c: Inline[];
  line: number; // which line of the note it came from (so a tick-box can be toggled in the text)
  checked?: boolean;
}

export type Block =
  | { t: "heading"; level: 1 | 2 | 3; c: Inline[] }
  | { t: "p"; c: Inline[] }
  | { t: "quote"; c: Inline[] }
  | { t: "ul"; items: Item[] }
  | { t: "ol"; items: Item[] }
  | { t: "tasks"; items: Item[] }
  | { t: "hr" };

const MAX_DEPTH = 3;

// Only http and https, no embedded passwords. Anything else (javascript:, data:, file:, a bare "//evil") is not a link.
export function safeUrl(raw: string): string | null {
  if (raw.length > 2000 || /[\u0000- \u007f-\u009f<>"]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password || !url.hostname) return null;
    return url.href;
  } catch {
    return null;
  }
}

const isWord = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

// Walks the text once, left to right, using indexOf (never a backtracking pattern), so odd or hostile text cannot make it slow.
export function inline(text: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let buffer = "";
  let i = 0;
  const flush = () => {
    if (buffer) out.push({ t: "text", v: buffer });
    buffer = "";
  };

  while (i < text.length) {
    const ch = text[i];

    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: "code", v: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (ch === "*" && text[i + 1] === "*" && depth < MAX_DEPTH) {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ t: "bold", c: inline(text.slice(i + 2, end), depth + 1) });
        i = end + 2;
        continue;
      }
    }

    if ((ch === "*" || ch === "_") && text[i + 1] !== ch && text[i + 1] !== " " && depth < MAX_DEPTH && !(ch === "_" && isWord(text[i - 1]))) {
      const end = text.indexOf(ch, i + 1);
      if (end > i + 1 && text[end - 1] !== " " && !(ch === "_" && isWord(text[end + 1]))) {
        flush();
        out.push({ t: "italic", c: inline(text.slice(i + 1, end), depth + 1) });
        i = end + 1;
        continue;
      }
    }

    if (ch === "[") {
      const close = text.indexOf("](", i + 1);
      const end = close > 0 ? text.indexOf(")", close + 2) : -1;
      const href = end > 0 ? safeUrl(text.slice(close + 2, end)) : null;
      if (href && close > i + 1) {
        flush();
        out.push({ t: "link", href, c: depth < MAX_DEPTH ? inline(text.slice(i + 1, close), depth + 1) : [{ t: "text", v: text.slice(i + 1, close) }] });
        i = end + 1;
        continue;
      }
    }

    if ((ch === "h" || ch === "H") && /^https?:\/\//i.test(text.slice(i, i + 8)) && !isWord(text[i - 1])) {
      let end = i;
      while (end < text.length && !/\s/.test(text[end])) end++;
      let raw = text.slice(i, end);
      const trimmed = raw.replace(/[.,;:!?)\]]+$/, ""); // a full stop after a link is not part of it
      raw = trimmed;
      const href = safeUrl(raw);
      if (href) {
        flush();
        out.push({ t: "link", href, c: [{ t: "text", v: raw }] });
        i += raw.length;
        continue;
      }
    }

    buffer += ch;
    i++;
  }
  flush();
  return out;
}

const TASK = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const ORDERED = /^\s*\d{1,3}[.)]\s+(.*)$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;

export function parse(body: string): Block[] {
  const lines = body.split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const endParagraph = () => {
    if (paragraph.length) blocks.push({ t: "p", c: inline(paragraph.join("\n")) });
    paragraph = [];
  };
  const addItem = (kind: "ul" | "ol" | "tasks", item: Item) => {
    const last = blocks[blocks.length - 1];
    if (last && last.t === kind) last.items.push(item);
    else blocks.push({ t: kind, items: [item] });
  };

  lines.forEach((raw, line) => {
    const text = raw.replace(/\s+$/, "");
    if (text.trim() === "") return endParagraph();
    let m: RegExpMatchArray | null;
    if ((m = text.match(HEADING))) {
      endParagraph();
      blocks.push({ t: "heading", level: m[1].length as 1 | 2 | 3, c: inline(m[2]) });
    } else if (RULE.test(text)) {
      endParagraph();
      blocks.push({ t: "hr" });
    } else if ((m = text.match(TASK))) {
      endParagraph();
      addItem("tasks", { c: inline(m[2]), line, checked: m[1] !== " " });
    } else if ((m = text.match(BULLET))) {
      endParagraph();
      addItem("ul", { c: inline(m[1]), line });
    } else if ((m = text.match(ORDERED))) {
      endParagraph();
      addItem("ol", { c: inline(m[1]), line });
    } else if (text.startsWith("> ")) {
      endParagraph();
      blocks.push({ t: "quote", c: inline(text.slice(2)) });
    } else {
      paragraph.push(text);
    }
  });
  endParagraph();
  return blocks;
}

// Ticks or unticks the tick-box on one line of the note, and changes nothing else.
export function toggleTask(body: string, line: number): string {
  const lines = body.split("\n");
  const current = lines[line];
  if (current === undefined) return body;
  const m = current.match(/^(\s*[-*]\s+\[)([ xX])(\]\s)/);
  if (!m) return body;
  lines[line] = `${m[1]}${m[2] === " " ? "x" : " "}${current.slice(m[0].length - 2)}`;
  return lines.join("\n");
}

export const countWords = (body: string) => (body.trim() === "" ? 0 : body.trim().split(/\s+/).length);
