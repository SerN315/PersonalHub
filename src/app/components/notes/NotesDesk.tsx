"use client";
import { useEffect, useRef, useState } from "react";
import BasicIcon from "../ultis/icons";
import NoteView from "./NoteView";
import { getUserWidgets } from "@/app/apis/widgets";
import { NOTE_COLORS, type NoteColor, type NoteSummary } from "@/app/apis/notes";
import { asRecord } from "@/app/utils/widgetData";
import { countWords, toggleTask } from "@/app/utils/notes/markdown";
import { saveBeforeLeaving, useNotesStore } from "@/app/utils/notes/store";
import "@/app/styles/pages/notes.scss";

const when = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function IndexItem({ note, active, onOpen }: { note: NoteSummary; active: boolean; onOpen: (id: string) => void }) {
  return (
    <li>
      <button type="button" className={`index__item ${active ? "is-active" : ""}`} data-paper={note.color} onClick={() => onOpen(note.id)} aria-current={active ? "true" : undefined}>
        <span className="index__title">{note.pinned && <BasicIcon icon="StarIcon" size={12} />} {note.title || "Untitled"}</span>
        <span className="index__preview">{note.preview || "Empty page"}</span>
      </button>
    </li>
  );
}

function Status() {
  const save = useNotesStore((s) => s.save);
  const savedAt = useNotesStore((s) => s.savedAt);
  const error = useNotesStore((s) => s.saveError);
  const text = save === "saving" ? "Saving..." : save === "dirty" ? "Writing..." : save === "offline" ? "Offline. It will save when you are back." : save === "error" ? error || "Could not save" : save === "conflict" ? "Changed somewhere else" : savedAt ? `Saved ${when(savedAt)}` : "Saved";
  return <span className={`page__status page__status--${save}`} role="status">{text}</span>;
}

// The Notes tab: a leather notebook with an index down the side and a page you write on. It autosaves, keeps you from overwriting a note
// that changed in another tab, and shows your words with a little safe formatting when you switch from Write to Read.
export default function NotesDesk() {
  const items = useNotesStore((s) => s.items);
  const status = useNotesStore((s) => s.status);
  const query = useNotesStore((s) => s.query);
  const active = useNotesStore((s) => s.active);
  const draft = useNotesStore((s) => s.draft);
  const conflict = useNotesStore((s) => s.conflict);
  const load = useNotesStore((s) => s.load);
  const search = useNotesStore((s) => s.search);
  const open = useNotesStore((s) => s.open);
  const leave = useNotesStore((s) => s.leave);
  const create = useNotesStore((s) => s.create);
  const edit = useNotesStore((s) => s.edit);
  const saveNow = useNotesStore((s) => s.saveNow);
  const setColor = useNotesStore((s) => s.setColor);
  const togglePin = useNotesStore((s) => s.togglePin);
  const remove = useNotesStore((s) => s.remove);
  const useTheirs = useNotesStore((s) => s.useTheirs);
  const keepMine = useNotesStore((s) => s.keepMineAsNew);

  const [reading, setReading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sticky, setSticky] = useState<string>("");
  const [brought, setBrought] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void load();
    // a final save when the page closes, and when the tab is hidden
    const hide = () => saveBeforeLeaving();
    const visibility = () => document.visibilityState === "hidden" && saveBeforeLeaving();
    window.addEventListener("pagehide", hide);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("pagehide", hide);
      document.removeEventListener("visibilitychange", visibility);
      void useNotesStore.getState().saveNow();
    };
  }, [load]);

  // the text of your sticky note, so it can be brought into the notebook
  useEffect(() => {
    let cancelled = false;
    getUserWidgets()
      .then((widgets) => {
        const note = asRecord(widgets.find((w) => w.type === "sticky")?.data).note;
        if (!cancelled && typeof note === "string") setSticky(note.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // typing in the search box waits a moment
  const [typed, setTyped] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => void search(typed), 250);
    return () => clearTimeout(timer);
  }, [typed, search]);

  // Ctrl or Cmd + S saves right now
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveNow();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [saveNow]);

  const onTick = (line: number) => draft && edit({ body: toggleTask(draft.body, line) });
  const paper: NoteColor = active?.color ?? "paper";

  return (
    <div className="notes">
      <header className="notes__head">
        <p className="notes__eyebrow">Notes</p>
        <h1>Your notebook</h1>
      </header>

      <div className={`notebook ${active ? "has-page" : ""}`}>
        <aside className="index" aria-label="All notes">
          <div className="index__tools">
            <label className="index__search">
              <BasicIcon icon="Search01Icon" size={15} />
              <span className="sr-only">Search notes</span>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Search" maxLength={60} />
            </label>
            <button type="button" className="index__new" onClick={() => void create()}><BasicIcon icon="PlusSignIcon" size={16} /> New note</button>
          </div>
          {sticky && !brought && (
            <button type="button" className="index__sticky" onClick={() => { setBrought(true); void create({ title: "From my sticky note", body: sticky }); }}>
              <BasicIcon icon="StickyNoteIcon" size={15} /> Bring in my sticky note
            </button>
          )}
          {status === "error" && <p className="index__note">Could not load your notes. <button type="button" onClick={() => void load()}>Try again</button></p>}
          <ul className="index__list">
            {items.map((note) => <IndexItem key={note.id} note={note} active={note.id === active?.id} onOpen={(id) => void open(id)} />)}
          </ul>
          {status === "ready" && items.length === 0 && <p className="index__note">{query ? "Nothing matches that." : "A fresh notebook. Start your first page."}</p>}
          <p className="index__foot">
            {items.length} note{items.length === 1 ? "" : "s"} · <a href="/api/notes/export" download>Download all</a>
          </p>
        </aside>

        <section className="page" data-paper={paper} aria-label={active ? "Note" : "Notebook"}>
          {!active || !draft ? (
            <div className="page__empty">
              <BasicIcon icon="StickyNoteIcon" size={34} strokeWidth={1.2} />
              <p>Pick a note from the index, or start a new page.</p>
              <button type="button" className="index__new" onClick={() => void create()}><BasicIcon icon="PlusSignIcon" size={16} /> New note</button>
            </div>
          ) : (
            <>
              {active.pinned && <span className="page__ribbon" aria-hidden />}
              <div className="page__tools">
                <button type="button" className="page__back" onClick={() => void leave()}><BasicIcon icon="ArrowLeft01Icon" size={16} /> All notes</button>
                <div className="page__mode" role="group" aria-label="View">
                  <button type="button" aria-pressed={!reading} onClick={() => { setReading(false); }}>Write</button>
                  <button type="button" aria-pressed={reading} onClick={() => setReading(true)}>Read</button>
                </div>
                <div className="page__colors" role="radiogroup" aria-label="Paper colour">
                  {NOTE_COLORS.map((c) => <button key={c} type="button" role="radio" aria-checked={c === active.color} aria-label={c} data-paper={c} onClick={() => void setColor(c)} />)}
                </div>
                <button type="button" className={`page__icon ${active.pinned ? "is-on" : ""}`} aria-pressed={active.pinned} onClick={() => void togglePin()} aria-label={active.pinned ? "Unpin this note" : "Pin this note"}><BasicIcon icon="StarIcon" size={17} /></button>
                <button type="button" className={`page__icon page__icon--danger ${confirmDelete ? "is-armed" : ""}`} onClick={() => (confirmDelete ? (setConfirmDelete(false), void remove()) : setConfirmDelete(true))} onBlur={() => setConfirmDelete(false)} aria-label={confirmDelete ? "Press again to delete this note" : "Delete this note"}>
                  <BasicIcon icon="Delete02Icon" size={17} />{confirmDelete && <span>Delete?</span>}
                </button>
              </div>

              {conflict && (
                <div className="page__conflict" role="alert">
                  <b>This note was changed somewhere else.</b> What you see here has not been saved.
                  <span>
                    <button type="button" onClick={useTheirs}>Show the newer version</button>
                    <button type="button" onClick={() => void keepMine()}>Keep mine as a new note</button>
                  </span>
                </div>
              )}

              <input className="page__title" value={draft.title} onChange={(e) => edit({ title: e.target.value })} placeholder="Untitled" maxLength={120} aria-label="Title" />
              {reading ? (
                <div className="page__read"><NoteView body={draft.body} onToggle={conflict ? undefined : onTick} /></div>
              ) : (
                <textarea ref={bodyRef} className="page__body" value={draft.body} onChange={(e) => edit({ body: e.target.value })} placeholder={"Write here...\n\n# A heading\n- a bullet\n- [ ] a tick-box\n**bold**, *italic*, [a link](https://example.com)"} aria-label="Note" spellCheck />
              )}

              <footer className="page__foot">
                <Status />
                <span>{countWords(draft.body)} words</span>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
