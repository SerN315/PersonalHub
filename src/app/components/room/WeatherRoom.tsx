"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import WeatherTv from "./WeatherTv";
import LocationGlobe from "./LocationGlobe";
import RoomWidgetPanel from "./RoomWidgetPanel";
import MobileWeather from "./MobileWeather";
import WindowCurtains from "./WindowCurtains";
import { StickyNote, TableRadio, WallCalendar, WallClock } from "./RoomObjects";
import { warmRoomWidgets } from "./useRoomWidget";
import { preloadWidget } from "@/app/widgets/registry";
import { PROPS, type RoomProp } from "./roomProps";
import { useIsMobile } from "./useIsMobile";
import { useSkyStore } from "@/app/utils/weather/skyStore";
import "@/app/styles/pages/weatherRoom.scss";

// The Weather tab: a pixel-art room. A modern window with its side panes slid back (so nothing crosses the sky), the
// animated picture for the current condition behind a soft grey glass, a TV with the forecast on the counter, a globe to look at
// the sky somewhere else, and a clock, calendar and sticky note that each open their widget. Layers sit at different depths and
// drift a little with the mouse; that only sets two CSS variables, so nothing re-renders.
export default function WeatherRoom() {
  const load = useSkyStore((s) => s.load);
  const background = useSkyStore((s) => s.background);
  const sky = useSkyStore((s) => s.sky);
  const stage = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const [open, setOpen] = useState<RoomProp | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    load();
    // Everything a press could open is made ready while you look around: your widget list now, the widgets' code when idle.
    warmRoomWidgets();
    const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 1200));
    idle(() => PROPS.forEach((prop) => preloadWidget(prop.widget)));
  }, [load]);

  useEffect(() => {
    if (mobile) return;
    const el = stage.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      set(((event.clientX - rect.left) / rect.width - 0.5) * 2, ((event.clientY - rect.top) / rect.height - 0.5) * 2);
    };
    const leave = () => set(0, 0);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [mobile]);

  const night = sky?.isDay === 0;
  return (
    <div className="weatherRoom">
      <h1 className="sr-only">Weather</h1>
      {mobile ? (
        <MobileWeather onOpen={setOpen} />
      ) : (
      <div className="room" ref={stage} data-night={night ? "true" : undefined} role="group" aria-label={sky ? `A window onto the sky: ${sky.condition}, ${sky.temperature} degrees in ${sky.location}` : "A window onto the sky"}>
        <div className="scene">
          <div className="room__layer room__wall" style={{ ["--depth" as string]: 3 }} aria-hidden />

          <div className="room__layer room__counter" style={{ ["--depth" as string]: 10 }} aria-hidden>
            <div className="counter__top" />
            <div className="counter__front" />
          </div>

          <div className="room__layer room__window" style={{ ["--depth" as string]: 6 }} aria-hidden>
            <div className="window">
              <div className="window__outside" style={{ backgroundImage: background ? `url("${background}")` : undefined }} />
              <div className="window__sash window__sash--left"><i /></div>
              <div className="window__sash window__sash--right"><i /></div>
              <div className="window__glass" />
            </div>
            <div className="window__sill" />
          </div>

          <WindowCurtains />

          <div className="room__layer room__prop room__clock" style={{ ["--depth" as string]: 5 }}><WallClock prop={PROPS[0]} onOpen={setOpen} /></div>
          <div className="room__layer room__prop room__calendar" style={{ ["--depth" as string]: 5 }}><WallCalendar prop={PROPS[1]} onOpen={setOpen} /></div>
          <div className="room__layer room__prop room__sticky" style={{ ["--depth" as string]: 9 }}><StickyNote prop={PROPS[2]} onOpen={setOpen} /></div>

          <div className="room__layer room__tv" style={{ ["--depth" as string]: 16 }}>
            <WeatherTv />
          </div>

          <div className="room__layer room__stand room__radio" style={{ ["--depth" as string]: 14 }}><div className="stand"><TableRadio prop={PROPS[3]} onOpen={setOpen} /></div></div>

          <div className="room__layer room__globe" style={{ ["--depth" as string]: 14 }}>
            <LocationGlobe />
          </div>
        </div>
      </div>
      )}

      {open && <RoomWidgetPanel key={open.widget} type={open.widget} create={"create" in open ? open.create : false} onClose={close} />}
    </div>
  );
}
