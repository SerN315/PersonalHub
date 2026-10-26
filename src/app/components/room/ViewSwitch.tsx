"use client";
import { memo } from "react";
import BasicIcon from "../ultis/icons";
import { setMyDayView, useMyDayView, type MyDayView } from "@/app/utils/myDayView";
import { preloadMyDay } from "@/app/dashboard/MyDay";
import "@/app/styles/ui/viewSwitch.scss";

const OPTIONS: { view: MyDayView; label: string; icon: "DashboardSquare01Icon" | "Home03Icon" }[] = [
  { view: "board", label: "Board", icon: "DashboardSquare01Icon" },
  { view: "room", label: "Room", icon: "Home03Icon" },
];

// The little switch between the two views of My day. `floating` puts it over the corner of the Room.
function ViewSwitch({ floating = false }: { floating?: boolean }) {
  const current = useMyDayView();
  return (
    <div className={`viewSwitch ${floating ? "viewSwitch--floating" : ""}`} role="group" aria-label="View">
      {OPTIONS.map((option) => (
        <button
          key={option.view}
          type="button"
          aria-pressed={current === option.view}
          className={current === option.view ? "is-on" : ""}
          onClick={() => setMyDayView(option.view)}
          onPointerEnter={() => preloadMyDay(option.view)}
          onFocus={() => preloadMyDay(option.view)}
        >
          <BasicIcon icon={option.icon} size={16} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default memo(ViewSwitch);
