"use client";
import { Suspense } from "react";
import RadioWidget from "../widgets/radio/RadioWidget";
import RecentStations from "./RecentStations";
import SleepTimer from "./SleepTimer";
import { useRoomWidget } from "../room/useRoomWidget";
import { getWidgetDefinition } from "@/app/widgets/registry";
import "@/app/styles/pages/radio.scss";

// The Radio tab: the same radio as on "My day", just big enough for YouTube's player, with a sleep timer and the stations you played lately.
export default function RadioDesk() {
  const widget = useRoomWidget("radio", { create: true });
  const tint = getWidgetDefinition("radio")?.tint;
  return (
    <div className="radioDesk">
      <header className="radioDesk__head">
        <p className="radioDesk__eyebrow">Radio</p>
        <h1>The listening corner</h1>
      </header>
      <div className="radioDesk__grid">
        <div className="radioDesk__set">
          <Suspense fallback={null}>
            {widget.ready && <RadioWidget id={widget.id} data={widget.data} onData={widget.onData} tint={tint} />}
          </Suspense>
        </div>
        <aside className="radioDesk__side">
          <SleepTimer />
          <RecentStations />
        </aside>
      </div>
    </div>
  );
}
