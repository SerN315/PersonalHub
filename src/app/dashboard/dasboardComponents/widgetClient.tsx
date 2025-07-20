"use client";

import React, { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { icons } from "hugeicons-react";
import PomodoroWidget from "@/app/components/widgets/podoromoWidget";
import StickyNotesWidgets from "@/app/components/widgets/stickyNotes";
import WatchWidget from "@/app/components/widgets/watch";
import WeatherWidget from "@/app/components/widgets/weather";
import TodoListWidget from "@/app/components/widgets/todolist";

import { useEditMode } from "@/app/contexts/editWidgetContext";
import BasicIcon from "@/app/components/ultis/icons";

// Default layout configuration
const defaultLayoutMap: Record<string, any> = {
  sticky: { w: 4, h: 1 },
  todo: { w: 4, h: 1 },
  weather: { w: 4, h: 1 },
  pomodoro: { w: 2, h: 2, minW: 2 },
  clock: { w: 4, h: 3, minW: 3, minH: 3 },
};

const widgetOptions = [
  { id: "clock", name: "Clock", icon: "ClockIcon" },
  { id: "todo", name: "To-Do List", icon: "TaskDone01Icon" },
  { id: "sticky", name: "Sticky Notes", icon: "StickyNoteIcon" },
  { id: "pomodoro", name: "Pomodoro Timer", icon: "AlarmClockIcon" },
  { id: "weather", name: "Weather", icon: "CloudIcon" },
];

export default function WidgetClient() {
  const [layout, setLayout] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<
    Record<string, { visible: boolean; minimized: boolean }>
  >({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { editMode, setEditMode } = useEditMode();

  //Edit mode
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const onMouseDown = () => {
      timer = setTimeout(() => setEditMode(true), 600);
    };

    const onMouseUp = () => clearTimeout(timer);

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Disable editMode
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

  const addWidget = (id: string) => {
    const base = defaultLayoutMap[id];
    if (!base) return;

    const { w, h, minW, minH } = base;
    const { x, y } = getNextPosition(layout, w, h);

    const newItem = {
      i: id,
      x,
      y,
      w,
      h,
      ...(minW && { minW }),
      ...(minH && { minH }),
    };

    setLayout((prev) => [...prev, newItem]);
    setWidgets((prev) => ({
      ...prev,
      [id]: { visible: true, minimized: false },
    }));
  };

  const handleClose = (id: string) => {
    setWidgets((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: false },
    }));
  };

  const handleMinimize = (id: string) => {
    setWidgets((prev) => ({
      ...prev,
      [id]: { ...prev[id], minimized: !prev[id].minimized },
    }));
  };

  const COLS = 12;

  function getNextPosition(
    currentLayout: any[],
    widgetW: number,
    widgetH: number
  ) {
    const occupied: number[] = Array(COLS).fill(0);

    currentLayout.forEach(({ x, y, w, h }) => {
      for (let i = x; i < x + w; i++) {
        occupied[i] = Math.max(occupied[i], y + h);
      }
    });

    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= COLS - widgetW; x++) {
        let canPlace = true;
        for (let i = x; i < x + widgetW; i++) {
          if (occupied[i] > y) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) return { x, y };
      }
    }

    return { x: 0, y: 0 };
  }

  const renderWidget = (id: string) => {
    const minimized = widgets[id]?.minimized;

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
          <TodoListWidget
            id="todo"
            minimized={minimized}
            onClose={() => handleClose("todo")}
            onMinimize={() => handleMinimize("todo")}
          />
        );
      case "weather":
        return (
          <WeatherWidget
            id="weather"
            minimized={minimized}
            onClose={() => handleClose("weather")}
            onMinimize={() => handleMinimize("weather")}
          />
        );
      case "clock":
        return (
          <WatchWidget
            id="clock"
            minimized={minimized}
            onClose={() => handleClose("clock")}
            onMinimize={() => handleMinimize("clock")}
            paused={editMode}
          />
        );
      default:
        return null;
    }
  };

  const availableWidgets = widgetOptions
    .filter((opt) => !layout.find((item) => item.i === opt.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="WidgetAdder">
      <div className="WidgetAdder__container">
        <div className="WidgetAdder__buttonContainer">
          <button
            type="button"
            className="WidgetAdder__button"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <BasicIcon icon="PlusSignIcon" />
          </button>
          <div className="decoration" style={{ cursor: "default" }}>
            {dropdownOpen && <BasicIcon icon="ArrowDown01Icon" />}
            {!dropdownOpen && <BasicIcon icon="ArrowUp01Icon" />}
          </div>
        </div>

        {dropdownOpen && (
          <div className="WidgetAdder__dropdown">
            <div className="widgetDropdown">
              {availableWidgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => {
                    addWidget(widget.id);
                    setDropdownOpen(false);
                  }}
                  className="widgetDropdown__item"
                >
                  <BasicIcon icon={widget.icon as keyof typeof icons} />
                  {widget.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="WidgetAdder__grid">
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          width={1200}
          autoSize={true}
          rowHeight={100}
          draggableHandle={editMode ? ".widgetWrapper" : "none"}
        >
          {layout.map((item) => {
            const id = item.i;
            if (!widgets[id]?.visible) return null;

            return (
              <div key={item.i} data-grid={item}>
                <div className="widgetWrapper rounded-xl overflow-hidden shadow-lg h-full">
                  {renderWidget(id)}
                </div>
              </div>
            );
          })}
        </GridLayout>
      </div>
    </div>
  );
}
