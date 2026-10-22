"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { applyViewFromAddress, useMyDayView, type MyDayView } from "@/app/utils/myDayView";

// Each view is its own chunk and only the one you are in is downloaded (the other starts loading when you point at its switch).
const loadBoard = () => import("./dasboardComponents/widgetClient");
const loadRoom = () => import("@/app/components/room/WeatherRoom");
const Board = dynamic(loadBoard);
const Room = dynamic(loadRoom);

export const preloadMyDay = (view: MyDayView) => void (view === "board" ? loadBoard() : loadRoom());

// "My day": the Board or the Room, whichever you were last in (or the one a link asked for).
export default function MyDay() {
  const view = useMyDayView();
  useEffect(() => applyViewFromAddress(), []);
  if (view === null) return null; // a moment: we do not know yet which one you were in
  return view === "room" ? <Room /> : <Board />;
}
