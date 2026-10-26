"use client";
import { Suspense, useEffect } from "react";
import RadioWidget from "../widgets/radio/RadioWidget";
import PartyRoom from "./party/PartyRoom";
import PartyStart from "./party/PartyStart";
import RecentStations from "./RecentStations";
import SleepTimer from "./SleepTimer";
import { useRoomWidget } from "../room/useRoomWidget";
import { usePartyStore } from "@/app/utils/party/store";
import { getWidgetDefinition } from "@/app/widgets/registry";
import "@/app/styles/pages/radio.scss";

// The Radio tab: the same radio as on "My day", just big enough for YouTube's player, with a sleep timer, the stations you played lately,
// and listening parties (you and your friends hear the same thing, and they can suggest songs).
export default function RadioDesk() {
  const widget = useRoomWidget("radio", { create: true });
  const tint = getWidgetDefinition("radio")?.tint;
  const inParty = usePartyStore((s) => s.status === "active");

  // coming back to the tab finds the party you were in; leaving it stops asking the server for news
  useEffect(() => {
    void usePartyStore.getState().restore();
    return () => usePartyStore.getState().suspend();
  }, []);

  return (
    <div className="radioDesk">
      <header className="radioDesk__head">
        <p className="radioDesk__eyebrow">Radio</p>
        <h1>The listening corner</h1>
      </header>
      <div className="radioDesk__grid">
        <div className="radioDesk__set">
          <Suspense fallback={null}>{widget.ready && <RadioWidget id={widget.id} data={widget.data} onData={widget.onData} tint={tint} />}</Suspense>
        </div>
        <aside className="radioDesk__side">
          {!inParty && (
            <Suspense fallback={null}>
              <PartyStart />
            </Suspense>
          )}
          <SleepTimer />
          <RecentStations />
        </aside>
      </div>
      {inParty && <PartyRoom />}
    </div>
  );
}
