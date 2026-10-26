"use client";
import { memo, useMemo } from "react";
import { parse, type Block, type Inline } from "@/app/utils/notes/markdown";

// Turns a note's text into elements. It only ever builds elements from the parsed data (never from HTML), so whatever is written in a note
// shows as text. Links open in a new tab and cannot reach back into this page.
function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.t) {
          case "text":
            return node.v;
          case "bold":
            return <strong key={i}><Inlines nodes={node.c} /></strong>;
          case "italic":
            return <em key={i}><Inlines nodes={node.c} /></em>;
          case "code":
            return <code key={i}>{node.v}</code>;
          case "link":
            return <a key={i} href={node.href} target="_blank" rel="noopener noreferrer nofollow"><Inlines nodes={node.c} /></a>;
        }
      })}
    </>
  );
}

function BlockView({ block, onToggle }: { block: Block; onToggle?: (line: number) => void }) {
  switch (block.t) {
    case "heading": {
      const Tag = (`h${block.level + 1}` as "h2" | "h3" | "h4"); // the page's own title is the h1
      return <Tag><Inlines nodes={block.c} /></Tag>;
    }
    case "p":
      return <p><Inlines nodes={block.c} /></p>;
    case "quote":
      return <blockquote><Inlines nodes={block.c} /></blockquote>;
    case "hr":
      return <hr />;
    case "ul":
      return <ul>{block.items.map((item) => <li key={item.line}><Inlines nodes={item.c} /></li>)}</ul>;
    case "ol":
      return <ol>{block.items.map((item) => <li key={item.line}><Inlines nodes={item.c} /></li>)}</ol>;
    case "tasks":
      return (
        <ul className="noteView__tasks">
          {block.items.map((item) => (
            <li key={item.line} className={item.checked ? "is-done" : ""}>
              <label>
                <input type="checkbox" checked={!!item.checked} onChange={() => onToggle?.(item.line)} disabled={!onToggle} />
                <span><Inlines nodes={item.c} /></span>
              </label>
            </li>
          ))}
        </ul>
      );
  }
}

function NoteViewBase({ body, onToggle }: { body: string; onToggle?: (line: number) => void }) {
  const blocks = useMemo(() => parse(body), [body]);
  if (blocks.length === 0) return <p className="noteView__empty">Nothing written yet.</p>;
  return (
    <div className="noteView">
      {blocks.map((block, i) => <BlockView key={i} block={block} onToggle={onToggle} />)}
    </div>
  );
}

export default memo(NoteViewBase);
