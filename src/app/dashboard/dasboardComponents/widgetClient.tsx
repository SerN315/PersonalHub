"use client";
import React, { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import PomodoroWidget from "@/app/components/widgets/podoromoWidget";
import { useEditMode } from "@/app/contexts/editWidgetContext";
import StickyNotesWidgets from "@/app/components/widgets/stickyNotes";
import WatchWidget from "@/app/components/widgets/watch";

  export default function WidgetClient({ layout }: { layout: any[] }) {
    const [widgets, setWidgets] = useState({
    sticky: { visible: true, minimized: false },
    todo: { visible: true, minimized: false },
    weather: { visible: true, minimized: false },
    pomodoro: { visible: true, minimized: false },
    clock: { visible: true, minimized: false },
  });
  const { editMode, setEditMode } = useEditMode();


  const handleClose = (id: keyof typeof widgets) => {
    setWidgets((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: false },
    }));
  };


  const handleGlobalHold = () => {
  let timer: NodeJS.Timeout;
  const onMouseDown = () => {
    timer = setTimeout(() => setEditMode(true), 600);
  };
  const onMouseUp = () => clearTimeout(timer);

  useEffect(() => {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);
};
handleGlobalHold();

useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    const widgets = document.querySelectorAll(".widgetWrapper");
    let clickedInside = false;
    widgets.forEach((el) => {
      if (el.contains(e.target as Node)) clickedInside = true;
    });
    if (!clickedInside) setEditMode(false);
  };
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);


  const handleMinimize = (id: keyof typeof widgets) => {
    setWidgets((prev) => ({
      ...prev,
      [id]: { ...prev[id], minimized: !prev[id].minimized },
    }));
  };

  const renderWidget = (id: string) => {
    const minimized = widgets[id as keyof typeof widgets]?.minimized;

    switch (id) {
      case "pomodoro":
        return (
          <PomodoroWidget
            id="pomodoro"
            minimized={minimized}
            onClose={() => handleClose("pomodoro")}
            onMinimize={() => handleMinimize("pomodoro")}
          />
        );
      case "sticky":
        return (
          <StickyNotesWidgets
            id="sticky"
            minimized={minimized}
            onClose={() => handleClose("sticky")}
            onMinimize={() => handleMinimize("sticky")}
          />
        );
      case "todo":
        return (
          <div>
            <ul className="list-disc pl-5">
              <li>Finish layout</li>
              <li>Make it pretty</li>
            </ul>
          </div>
        );
      case "weather":
        return <div>🌦️ Weather widget</div>;
      case "clock":
        return               <WatchWidget
      id="clock"
      minimized={minimized}
      onClose={() => handleClose("clock")}
      onMinimize={() => handleMinimize("clock")}
      paused={editMode}
    />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        width={1200}
        autoSize={true}
        draggableHandle={editMode ? ".widgetWrapper" : "none"}
      >
        {layout.map((item) => {
          const id = item.i as keyof typeof widgets;
          if (!widgets[id]?.visible) return null;

          return (
            <div key={item.i} data-grid={item} >
          <div className="rounded-xl overflow-hidden shadow-lg h-full">
          {renderWidget(item.i)}
        </div>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};

