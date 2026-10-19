"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import PomodoroWidget from "@/app/components/widgets/podoromoWidget";
import StickyNotesWidgets from "@/app/components/widgets/stickyNotes";
import WatchWidget from "@/app/components/widgets/watch";
import WeatherWidget from "@/app/components/widgets/weather";
import TodoListWidget from "@/app/components/widgets/todolist";
import BasicIcon from "@/app/components/ultis/icons";
import BaseButton from "@/app/components/ui/BaseButton";
import DayHeader from "./DayHeader";
import { useEditMode } from "@/app/contexts/editWidgetContext";
import { getUserWidgets, createWidget, deleteWidget, saveUserWidgetLayout, updateWidget } from "@/app/apis/widgets";
import { Widget, WidgetLayout, WidgetState } from "@/app/types/widgets";
import { useUserStore } from "@/app/utils/store/userStore";
import { useContainerWidth } from "@/app/utils/useContainerWidth";
import { TINTS, Tint } from "@/app/utils/preferences";
import type * as Icons from "@hugeicons/core-free-icons";

type LayoutDefaults = { w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number };

// Starting sizes (in grid cells) and the room each widget needs to stay usable.
const defaultLayoutMap: Record<string, LayoutDefaults> = {
  clock: { w: 3, h: 3, minW: 2, minH: 3 },
  todo: { w: 4, h: 4, minW: 3, minH: 3 },
  sticky: { w: 3, h: 3, minW: 2, minH: 2 },
  pomodoro: { w: 3, h: 3, minW: 2, minH: 3, maxW: 5, maxH: 5 },
  weather: { w: 5, h: 3, minW: 3, minH: 2, maxW: 8, maxH: 4 },
};

const defaultTint: Record<string, Tint> = { clock: "paper", todo: "paper", sticky: "butter", pomodoro: "peach", weather: "paper" };

const widgetOptions: { id: string; name: string; blurb: string; icon: keyof typeof Icons }[] = [
  { id: "clock", name: "Clock", blurb: "Time at a glance", icon: "ClockIcon" },
  { id: "todo", name: "To-do list", blurb: "Little things to do", icon: "TaskDone01Icon" },
  { id: "sticky", name: "Sticky note", blurb: "Jot something down", icon: "StickyNoteIcon" },
  { id: "pomodoro", name: "Pomodoro", blurb: "Focus in short bursts", icon: "AlarmClockIcon" },
  { id: "weather", name: "Weather", blurb: "The sky outside", icon: "SunCloud01Icon" },
];

const COLS = 12;
const ROW_HEIGHT = 100;
const STACK_BELOW = 720; // narrower than this the widgets stack in one column instead of a grid

const isTint = (value: unknown): value is Tint => typeof value === "string" && (TINTS as readonly string[]).includes(value);

function getNextPosition(currentLayout: WidgetLayout[], widgetW: number) {
  const occupied: number[] = Array(COLS).fill(0);
  currentLayout.forEach(({ x, y, w, h }) => {
    for (let i = x; i < x + w; i++) occupied[i] = Math.max(occupied[i], y + h);
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

const constraintsFor = (type: string) => {
  const d = defaultLayoutMap[type];
  return { ...(d?.minW && { minW: d.minW }), ...(d?.minH && { minH: d.minH }), ...(d?.maxW && { maxW: d.maxW }), ...(d?.maxH && { maxH: d.maxH }) };
};

export default function WidgetClient() {
  const [layout, setLayout] = useState<WidgetLayout[]>([]);
  const [widgets, setWidgets] = useState<Record<string, WidgetState>>({});
  const [widgetData, setWidgetData] = useState<Record<string, Widget>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const userId = useUserStore((state) => state.user?.id);
  const { editMode, setEditMode } = useEditMode();
  const [boardRef, boardWidth] = useContainerWidth<HTMLDivElement>();
  const menuRef = useRef<HTMLDivElement>(null);

  // The layout is saved only after a real change by the person (drag, resize, remove), never just because it loaded.
  const layoutDirty = useRef(false);
  const widgetDataRef = useRef(widgetData);
  useEffect(() => {
    widgetDataRef.current = widgetData;
  }, [widgetData]);

  // ---- load -----------------------------------------------------------------
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const userWidgets = await getUserWidgets();
        if (cancelled) return;
        const loadedLayout: WidgetLayout[] = [];
        const loadedWidgets: Record<string, WidgetState> = {};
        const loadedData: Record<string, Widget> = {};
        for (const widget of userWidgets) {
          const position = typeof widget.position === "string" ? JSON.parse(widget.position) : widget.position;
          loadedLayout.push({ i: widget.id, x: Number(position.x), y: Number(position.y), w: Number(position.w), h: Number(position.h), ...constraintsFor(widget.type) });
          loadedWidgets[widget.id] = { visible: true, minimized: false };
          loadedData[widget.id] = widget;
        }
        setLayout(loadedLayout);
        setWidgets(loadedWidgets);
        setWidgetData(loadedData);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---- save layout (debounced) ----------------------------------------------
  useEffect(() => {
    if (isLoading || !layoutDirty.current) return;
    const timeoutId = setTimeout(async () => {
      layoutDirty.current = false;
      try {
        await saveUserWidgetLayout(
          layout.map(({ i, x, y, w, h }) => ({ i, x: Number(x), y: Number(y), w: Number(w), h: Number(h) })),
          widgets
        );
      } catch {
        layoutDirty.current = true; // try again with the next change
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [layout, widgets, isLoading]);

  // ---- arrange mode ------------------------------------------------------------
  // Long-press a widget to start arranging (as before); clicking empty space ends it. The Arrange button does the same without a long press.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest(".widgetCard")) {
        timer = setTimeout(() => setEditMode(true), 600);
      } else if (!target.closest("[data-keep-editing]")) {
        setEditMode(false);
      }
    };
    const onUp = () => clearTimeout(timer);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      clearTimeout(timer);
    };
  }, [setEditMode]);

  // ---- add menu: closes on outside click or Escape -----------------------------
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // ---- actions (stable, so memoised widgets are not re-rendered by unrelated changes) ----
  const addWidget = useCallback(
    async (type: string) => {
      const base = defaultLayoutMap[type];
      if (!base || !userId) return;
      const { x, y } = getNextPosition(layout, base.w);
      try {
        const created = await createWidget({ type, position: { x, y, w: base.w, h: base.h }, data: {} });
        setLayout((prev) => [...prev, { i: created.id, x, y, w: base.w, h: base.h, ...constraintsFor(type) }]);
        setWidgets((prev) => ({ ...prev, [created.id]: { visible: true, minimized: false } }));
        setWidgetData((prev) => ({ ...prev, [created.id]: created }));
      } catch {
        /* one widget per type: a duplicate (another tab) or a lost connection simply does nothing */
      }
    },
    [userId, layout]
  );

  const handleClose = useCallback(async (widgetId: string) => {
    try {
      await deleteWidget(widgetId);
      layoutDirty.current = true;
      setWidgets((prev) => {
        const next = { ...prev };
        delete next[widgetId];
        return next;
      });
      setLayout((prev) => prev.filter((item) => item.i !== widgetId));
      setWidgetData((prev) => {
        const next = { ...prev };
        delete next[widgetId];
        return next;
      });
    } catch {
      /* it stays on screen; try again */
    }
  }, []);

  // Merges into the widget's saved data (a PUT replaces `data`, so the latest copy is merged here first).
  const handleData = useCallback((widgetId: string, patch: Record<string, unknown>) => {
    const current = widgetDataRef.current[widgetId];
    if (!current) return;
    const data = { ...(current.data ?? {}), ...patch };
    setWidgetData((prev) => (prev[widgetId] ? { ...prev, [widgetId]: { ...prev[widgetId], data } } : prev));
    updateWidget(widgetId, { data }).catch(() => {
      /* offline: the screen keeps the change; it is sent again with the next edit */
    });
  }, []);

  const handleTint = useCallback((widgetId: string, tint: Tint) => handleData(widgetId, { tint }), [handleData]);

  const onLayoutChange = useCallback((next: WidgetLayout[]) => setLayout(next), []);
  const onUserLayoutChange = useCallback((next: WidgetLayout[]) => {
    layoutDirty.current = true;
    setLayout(next);
  }, []);

  // ---- render --------------------------------------------------------------------
  const renderWidget = (type: string, id: string) => {
    const widget = widgetData[id];
    const tintValue = widget?.data?.tint;
    const common = {
      id,
      minimized: widgets[id]?.minimized,
      tint: isTint(tintValue) ? tintValue : defaultTint[type],
      data: widget?.data,
      onClose: handleClose,
      onTint: handleTint,
      onData: handleData,
    };
    switch (type) {
      case "clock":
        return <WatchWidget {...common} />;
      case "sticky":
        return <StickyNotesWidgets {...common} />;
      case "todo":
        return <TodoListWidget {...common} />;
      case "weather":
        return <WeatherWidget {...common} />;
      case "pomodoro":
        return <PomodoroWidget {...common} />;
      default:
        return null;
    }
  };

  const available = useMemo(() => widgetOptions.filter((opt) => !Object.values(widgetData).some((w) => w.type === opt.id)), [widgetData]);
  const visibleLayout = layout.filter((item) => widgets[item.i]?.visible);
  const stacked = boardWidth > 0 && boardWidth < STACK_BELOW;
  const stackOrder = [...visibleLayout].sort((a, b) => a.y - b.y || a.x - b.x);

  return (
    <div className="dashboard">
      <DayHeader>
        <BaseButton
          variant={editMode ? "primary" : "ghost"}
          size="sm"
          data-keep-editing
          aria-pressed={editMode}
          onClick={() => setEditMode(!editMode)}
          disabled={visibleLayout.length === 0}
        >
          <BasicIcon icon={editMode ? "Tick02Icon" : "Edit02Icon"} size={16} />
          {editMode ? "Done" : "Arrange"}
        </BaseButton>

        <div className="addMenu" ref={menuRef} data-keep-editing>
          <BaseButton size="sm" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} disabled={available.length === 0}>
            <BasicIcon icon="PlusSignIcon" size={16} />
            Add widget
          </BaseButton>
          {menuOpen && (
            <div className="addMenu__panel" role="menu">
              {available.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitem"
                  className="addMenu__item"
                  onClick={() => {
                    setMenuOpen(false);
                    addWidget(option.id);
                  }}
                >
                  <span className="addMenu__icon">
                    <BasicIcon icon={option.icon} size={20} />
                  </span>
                  <span className="addMenu__text">
                    <strong>{option.name}</strong>
                    <span>{option.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DayHeader>

      <div className="board" ref={boardRef}>
        {loadError && <p className="board__note">We couldn&apos;t load your widgets. Refresh to try again.</p>}

        {!isLoading && !loadError && visibleLayout.length === 0 && (
          <div className="board__empty">
            <BasicIcon icon="Plant01Icon" size={44} strokeWidth={1.2} />
            <h2>A blank page, just for you</h2>
            <p>Add a clock, a to-do list, a sticky note… whatever makes today feel good.</p>
            {available.length > 0 && <BaseButton onClick={() => setMenuOpen(true)}>Add your first widget</BaseButton>}
          </div>
        )}

        {boardWidth > 0 &&
          (stacked ? (
            <div className="stack">
              {stackOrder.map((item) => (
                <div key={item.i} className="stack__item" style={{ height: Math.max(item.h * ROW_HEIGHT, 180) }}>
                  {renderWidget(widgetData[item.i].type, item.i)}
                </div>
              ))}
            </div>
          ) : (
            <GridLayout
              className="layout"
              layout={visibleLayout}
              cols={COLS}
              width={boardWidth}
              autoSize
              rowHeight={ROW_HEIGHT}
              margin={[16, 16]}
              isDraggable={editMode}
              isResizable={editMode}
              onLayoutChange={onLayoutChange}
              onDragStop={onUserLayoutChange}
              onResizeStop={onUserLayoutChange}
              resizeHandles={["se"]}
              preventCollision={false}
              compactType="vertical"
            >
              {layout.map((item) => {
                if (!widgets[item.i]?.visible) return null;
                return (
                  <div key={item.i} data-grid={item}>
                    {renderWidget(widgetData[item.i].type, item.i)}
                  </div>
                );
              })}
            </GridLayout>
          ))}
      </div>
    </div>
  );
}
