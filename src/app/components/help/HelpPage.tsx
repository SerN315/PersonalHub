"use client";
import { useId, useState } from "react";
import Link from "next/link";
import BasicIcon from "../ultis/icons";
import AddIdea from "./AddIdea";
import { GUIDE, HOUSEKEEPING, PHASES, REVIEWED_ON, ROADMAP, SCORECARD, computeProgress, monthsLabel, remainingWeeks, type Status } from "@/app/help/content";
import "@/app/styles/pages/help.scss";

const STATUS: Record<Status, { label: string; plain: string }> = {
  done: { label: "Done", plain: "Built and working" },
  building: { label: "Building", plain: "Being worked on now" },
  next: { label: "Next", plain: "Planned soon" },
  later: { label: "Later", plain: "Planned, further off" },
};
const ORDER: Status[] = ["done", "building", "next", "later"];
const TABS = [
  { id: "guide", label: "Guide" },
  { id: "roadmap", label: "Roadmap" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const progress = computeProgress();
const titleOf = new Map(ROADMAP.map((item) => [item.id, item]));
const all = remainingWeeks();
const withoutApps = remainingWeeks(PHASES, ["apps"]);

function Guide() {
  return (
    <div className="guide">
      {GUIDE.map((section) => (
        <article key={section.id} className="guide__card" id={section.id}>
          <header>
            <span className="guide__icon" aria-hidden><BasicIcon icon={section.icon} size={22} /></span>
            <h2>{section.title}</h2>
          </header>
          <p className="guide__what">{section.what}</p>
          <p className="guide__why"><b>Why it is here</b>{section.why}</p>
          {section.parts && (
            <ul className="guide__parts">
              {section.parts.map((part) => (
                <li key={part.name}>
                  <BasicIcon icon={part.icon} size={18} />
                  <span><b>{part.name}</b> {part.text}</span>
                </li>
              ))}
            </ul>
          )}
          <ul className="guide__tips" aria-label="Tips">
            {section.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
          {section.href && <Link href={section.href} className="guide__open">{section.open} <BasicIcon icon="ArrowRight01Icon" size={14} /></Link>}
        </article>
      ))}
    </div>
  );
}

function Roadmap() {
  return (
    <div className="road">
      <section className="road__verdict" aria-labelledby="verdict">
        <h2 id="verdict">Is it usable?</h2>
        <p>
          <b>Yes, today.</b> As a daily personal hub it is a solid beta: sign in, plan your tasks, check the weather, play the radio, jot notes. Roughly{" "}
          <b>{progress.percent}%</b> of everything we have planned exists. The missing part is mostly connections to other tools (GitHub, email, Jira, Notion), which is
          the slower, more careful work.
        </p>
        <ul className="road__score">
          {SCORECARD.map((row) => (
            <li key={row.name}>
              <span className="road__scoreName">{row.name}</span>
              <span className="road__scoreBar" role="img" aria-label={`${row.score} out of 10`}><i style={{ width: `${row.score * 10}%` }} /></span>
              <b>{row.score}</b>
              <span className="road__scoreNote">{row.note}</span>
            </li>
          ))}
        </ul>
        <p className="road__fine">These are honest judgements, reviewed on {REVIEWED_ON}, not measurements.</p>
      </section>

      <section aria-labelledby="time">
        <h2 id="time">How long until it is complete?</h2>
        <p className="road__lead">
          About <b>{monthsLabel(all.min)} to {monthsLabel(all.max)}</b> for everything we have discussed, working part-time. Without the desktop and phone apps, about{" "}
          <b>{monthsLabel(withoutApps.min)} to {monthsLabel(withoutApps.max)}</b>. The everyday core is already here.
        </p>
        <p className="road__fine">These are guesses with a wide range. Connecting to other services (accounts, sign-in flows, their rules) is where surprises happen, and each one needs checking against the real service.</p>
        <ol className="phases">
          {PHASES.map((phase, index) => (
            <li key={phase.name} className="phase">
              <span className="phase__n" aria-hidden>{index + 1}</span>
              <div>
                <h3>{phase.name} <small>{phase.weeks[0] === phase.weeks[1] ? `${phase.weeks[0]} wk` : `${phase.weeks[0]}–${phase.weeks[1]} wk`}</small></h3>
                <p>{phase.note}</p>
                <p className="phase__items">
                  {phase.items.map((id) => <span key={id} className={`chip chip--${titleOf.get(id)?.status}`}>{titleOf.get(id)?.title}</span>)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="all">
        <h2 id="all">Everything on the list</h2>
        {ORDER.map((status) => {
          const items = ROADMAP.filter((item) => item.status === status);
          if (items.length === 0) return null;
          return (
            <div key={status} className={`group group--${status}`}>
              <h3><span className={`dot dot--${status}`} aria-hidden />{STATUS[status].label}<small>{STATUS[status].plain}</small></h3>
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <b>{item.title}</b>
                      <p>{item.text}</p>
                    </div>
                    {status !== "done" && (
                      <span className="mini" role="img" aria-label={`${Math.round(item.progress * 100)} percent done`}><i style={{ width: `${item.progress * 100}%` }} /></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="house">
        <h2 id="house">Before you rely on it</h2>
        <p className="road__lead">A few small jobs only the owner can do, so everything already built works properly:</p>
        <ul className="house">
          {HOUSEKEEPING.map((line) => <li key={line}><BasicIcon icon="Tick02Icon" size={16} />{line}</li>)}
        </ul>
      </section>
    </div>
  );
}

// The Help page: how much of the plan exists (a bar computed from the roadmap), then two tabs, a guide to every part and why it is
// there, and the roadmap with an honest view of where things stand and how long the rest might take.
export default function HelpPage() {
  const [tab, setTab] = useState<TabId>("guide");
  const base = useId();

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = TABS[(TABS.findIndex((t) => t.id === tab) + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].id;
    setTab(next);
    document.getElementById(`${base}-${next}`)?.focus();
  };

  return (
    <div className="help">
      <header className="help__head">
        <p className="help__eyebrow">Help</p>
        <h1>Everything here, and why it is here</h1>
        <p className="help__lede">PersonalHub is a calm desk to start your day at. This page explains each part, and shows where the project is heading.</p>
      </header>

      <section className="progress" aria-labelledby={`${base}-progress`}>
        <div className="progress__top">
          <b id={`${base}-progress`}>{progress.percent}%</b>
          <span>of everything planned is built. The everyday core is ready to use now.</span>
        </div>
        <div className="progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-labelledby={`${base}-progress`}>
          <i style={{ width: `${progress.percent}%` }} />
        </div>
        <ul className="progress__legend">
          {ORDER.map((status) => (
            <li key={status}><span className={`dot dot--${status}`} aria-hidden />{progress.counts[status]} {STATUS[status].label.toLowerCase()}</li>
          ))}
        </ul>
      </section>

      <div className="tabs" role="tablist" aria-label="Help sections" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button key={t.id} id={`${base}-${t.id}`} type="button" role="tab" aria-selected={tab === t.id} aria-controls={`${base}-panel`} tabIndex={tab === t.id ? 0 : -1} className={tab === t.id ? "is-on" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${tab}`} className="help__panel">
        {tab === "guide" ? <Guide /> : <Roadmap />}
      </div>

      <footer className="help__foot">
        <p>Have something that would make this better for you?</p>
        <AddIdea />
      </footer>
    </div>
  );
}
