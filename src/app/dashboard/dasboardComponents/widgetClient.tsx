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
import {
  getUserWidgets,
  createWidget,
  deleteWidget,
  saveUserWidgetLayout,
} from "@/app/apis/widgets";
import { Widget, WidgetLayout, WidgetState } from "@/app/types/widgets";
import { useUserStore } from "@/app/utils/store/userStore";

// Default layout map by type
const defaultLayoutMap: Record<string, any> = {
  sticky: { w: 4, h: 1 },
  todo: { w: 4, h: 1 },
  weather: { w: 4, h: 1, maxW: 6, maxH: 3, minH: 2, minW: 2 },
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
  const [widgets, setWidgets] = useState<Record<string, WidgetState>>({});
  const [widgetData, setWidgetData] = useState<Record<string, Widget>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const user = useUserStore((state) => state.user);
  const { editMode, setEditMode } = useEditMode();

  useEffect(() => {
    if (user?.id) {
      loadWidgets();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoading && user?.id && layout.length > 0) {
      const timeoutId = setTimeout(() => {
        saveLayoutToServer();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [layout, widgets, isLoading, user?.id]);

  const loadWidgets = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const userWidgets = await getUserWidgets(user.id);

      const loadedLayout: WidgetLayout[] = [];
      const loadedWidgets: Record<string, WidgetState> = {};
      const loadedData: Record<string, Widget> = {};

      userWidgets.forEach((widget: Widget) => {
        // Handle position data that might be stored as string or object
        let position;
        if (typeof widget.position === "string") {
          try {
            position = JSON.parse(widget.position);
          } catch (e) {
            console.error("Failed to parse position string:", widget.position);
            position = { x: 0, y: 0, w: 4, h: 1 }; // fallback
          }
        } else {
          position = widget.position;
        }

        loadedLayout.push({
          i: widget.id,
          x: Number(position.x),
          y: Number(position.y),
          w: Number(position.w),
          h: Number(position.h),
          ...(defaultLayoutMap[widget.type]?.minW && {
            minW: defaultLayoutMap[widget.type].minW,
          }),
          ...(defaultLayoutMap[widget.type]?.minH && {
            minH: defaultLayoutMap[widget.type].minH,
          }),
          ...(defaultLayoutMap[widget.type]?.maxW && {
            maxW: defaultLayoutMap[widget.type].maxW,
          }),
          ...(defaultLayoutMap[widget.type]?.maxH && {
            maxH: defaultLayoutMap[widget.type].maxH,
          }),
        });

        loadedWidgets[widget.id] = { visible: true, minimized: false };
        loadedData[widget.id] = widget;
      });

      setLayout(loadedLayout);
      setWidgets(loadedWidgets);
      setWidgetData(loadedData);
    } catch (error) {
      console.error("Failed to load widgets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLayoutToServer = async () => {
    if (!user?.id) return;
    try {
      // Ensure position data is properly formatted as objects, not strings
      const formattedLayout = layout.map((item) => ({
        i: item.i,
        x: Number(item.x),
        y: Number(item.y),
        w: Number(item.w),
        h: Number(item.h),
        // Remove any string conversion and ensure it's a proper object
        ...(item.minW && { minW: Number(item.minW) }),
        ...(item.minH && { minH: Number(item.minH) }),
      }));

      await saveUserWidgetLayout(user.id, formattedLayout, widgets);
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

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

  const addWidget = async (type: string) => {
    if (!user?.id) return;

    const base = defaultLayoutMap[type];
    if (!base) return;

    const { w, h, minW, minH } = base;
    const { x, y } = getNextPosition(layout, w, h);

    try {
      const newWidget = await createWidget({
        user_id: user.id,
        type,
        position: {
          x: Number(x),
          y: Number(y),
          w: Number(w),
          h: Number(h),
        },
        data: {},
      });

      const id = newWidget.id;

      setLayout((prev) => [
        ...prev,
        {
          i: id,
          x: Number(x),
          y: Number(y),
          w: Number(w),
          h: Number(h),
          ...(minW && { minW: Number(minW) }),
          ...(minH && { minH: Number(minH) }),
        },
      ]);

      setWidgets((prev) => ({
        ...prev,
        [id]: { visible: true, minimized: false },
      }));

      setWidgetData((prev) => ({
        ...prev,
        [id]: newWidget,
      }));
    } catch (error) {
      console.error("Failed to add widget:", error);
    }
  };

  const handleClose = async (widgetId: string) => {
    if (!user?.id) return;

    try {
      await deleteWidget(widgetId);

      setWidgets((prev) => {
        const updated = { ...prev };
        delete updated[widgetId];
        return updated;
      });

      setLayout((prev) => prev.filter((item) => item.i !== widgetId));

      setWidgetData((prev) => {
        const updated = { ...prev };
        delete updated[widgetId];
        return updated;
      });
    } catch (error) {
      console.error("Failed to delete widget:", error);
    }
  };

  const handleMinimize = (id: string) => {
    setWidgets((prev) => ({
      ...prev,
      [id]: { ...prev[id], minimized: !prev[id].minimized },
    }));
  };

  const onLayoutChange = (newLayout: any[]) => {
    setLayout(newLayout);
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

  const renderWidget = (type: string, id: string) => {
    const minimized = widgets[id]?.minimized;

    const commonProps = {
      id,
      minimized,
      onClose: () => handleClose(id),
      onMinimize: () => handleMinimize(id),
    };

    switch (type) {
      case "clock":
        return <WatchWidget {...commonProps} paused={editMode} />;
      case "sticky":
        return <StickyNotesWidgets {...commonProps} />;
      case "todo":
        return <TodoListWidget {...commonProps} />;
      case "weather":
        return <WeatherWidget {...commonProps} />;
      case "pomodoro":
        return <PomodoroWidget {...commonProps} />;
      default:
        return null;
    }
  };

  const availableWidgets = widgetOptions.filter(
    (opt) => !Object.values(widgetData).some((w) => w.type === opt.id)
  );

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
          layout={layout.filter((item) => widgets[item.i]?.visible)}
          cols={12}
          width={1200}
          autoSize={true}
          rowHeight={100}
          draggableHandle={editMode ? ".widgetWrapper" : "none"}
          onLayoutChange={onLayoutChange}
          onDragStop={onLayoutChange}
          onResizeStop={onLayoutChange}
        >
          {layout.map((item) => {
            const id = item.i;
            if (!widgets[id]?.visible) return null;

            return (
              <div key={id} data-grid={item}>
                <div className="widgetWrapper rounded-xl overflow-hidden shadow-lg h-full">
                  {renderWidget(widgetData[id].type, id)}
                </div>
              </div>
            );
          })}
        </GridLayout>
      </div>
    </div>
  );
}
