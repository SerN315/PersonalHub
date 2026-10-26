"use client";
import { memo, useEffect } from "react";
import BasicIcon from "../ultis/icons";
import { useRadioStore } from "@/app/utils/radio/engine";
import { recentStore, withRecent } from "@/app/utils/radio/recent";

// Remembers what you tuned to (in this browser) and lets you go back to it.
function RecentStations() {
  const recent = recentStore.use();
  const playing = useRadioStore((s) => s.station);
  const status = useRadioStore((s) => s.status);

  useEffect(() => {
    if (!playing || (status !== "playing" && status !== "loading")) return;
    recentStore.set(withRecent(recentStore.get(), playing));
  }, [playing, status]);

  return (
    <section className="deskCard" aria-label="Recently played">
      <h2><BasicIcon icon="ClockIcon" size={16} /> Recently played</h2>
      {recent.length === 0 ? (
        <p className="deskCard__fine">Stations you listen to show up here.</p>
      ) : (
        <ul className="recent">
          {recent.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => useRadioStore.getState().tune(s)} aria-current={playing?.id === s.id ? "true" : undefined}>
                <span>{s.name}</span>
                <small>{[s.country, s.tags[0]].filter(Boolean).join(" · ")}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default memo(RecentStations);
