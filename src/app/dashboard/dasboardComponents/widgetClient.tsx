"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import UnknownWidget from "@/app/components/widgets/UnknownWidget";
import { WIDGETS, COLS, clampSize, getWidgetDefinition, resizeLimits } from "@/app/widgets/registry";
import BasicIcon from "@/app/components/ultis/icons";
import BaseButton from "@/app/components/ui/BaseButton";
import DayHeader from "./DayHeader";
import ViewSwitch from "@/app/components/room/ViewSwitch";
import { useEditMode } from "@/app/contexts/editWidgetContext";
import { asRecord, getUserWidgets, createWidget, deleteWidget, saveUserWidgetLayout, updateWidget } from "@/app/apis/widgets";
import { Widget, WidgetLayout, WidgetState } from "@/app/types/widgets";
import { useUserStore } from "@/app/utils/store/userStore";
import { useContainerWidth } from "@/app/utils/useContainerWidth";
import { TINTS, Tint } from "@/app/utils/preferences";

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
          const saved = { w: Number(position.w), h: Number(position.h) };
          const size = clampSize(widget.type, saved);
          if (size.w !== saved.w || size.h !== saved.h) layoutDirty.current = true; // tell the server about the corrected size
          loadedLayout.push({ i: widget.id, x: Math.min(Number(position.x), COLS - size.w), y: Number(position.y), ...size, ...resizeLimits(widget.type) });
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
  // Arranging starts and ends ONLY with the Arrange / Done button. Nothing else toggles it (no long-press, no
  // click-outside), so grabbing a grip or clicking around while resizing never kicks you out of the mode.
  // It is switched off when you leave the dashboard so the next visit does not open mid-arrange.
  useEffect(() => () => setEditMode(false), [setEditMode]);

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
      const base = getWidgetDefinition(type)?.size;
      if (!base || !userId) return;
      const { x, y } = getNextPosition(layout, base.w);
      try {
        const created = await createWidget({ type, position: { x, y, w: base.w, h: base.h }, data: {} });
        setLayout((prev) => [...prev, { i: created.id, x, y, w: base.w, h: base.h, ...resizeLimits(type) }]);
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
    const data = { ...asRecord(current.data), ...patch };
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
    const definition = getWidgetDefinition(type);
    const tintValue = widget?.data?.tint;
    const common = {
      id,
      minimized: widgets[id]?.minimized,
      tint: isTint(tintValue) ? tintValue : definition?.tint,
      data: widget?.data,
      onClose: handleClose,
      onTint: handleTint,
      onData: handleData,
    };
    if (!definition) return <UnknownWidget {...common} />;
    const Component = definition.component;
    return <Component {...common} />;
  };

  const available = useMemo(() => WIDGETS.filter((definition) => !Object.values(widgetData).some((w) => w.type === definition.type)), [widgetData]);
  const visibleLayout = layout.filter((item) => widgets[item.i]?.visible);
  const stacked = boardWidth > 0 && boardWidth < STACK_BELOW;
  const stackOrder = [...visibleLayout].sort((a, b) => a.y - b.y || a.x - b.x);

  // A leftover cookie that the server no longer accepts: ask for a fresh sign-in instead of showing an empty board.
  if (!userId) {
    return (
      <div className="dashboard">
        <div className="board__empty" role="status">
          <BasicIcon icon="LockPasswordIcon" size={40} strokeWidth={1.2} />
          <h2>Sign in to see your day</h2>
          <p>Your widgets are waiting for you.</p>
          <BaseButton onClick={() => (window.location.href = "/auth/login")}>Sign in</BaseButton>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <DayHeader>
        <ViewSwitch />
        <BaseButton
          variant={editMode ? "primary" : "ghost"}
          size="sm"
          aria-pressed={editMode}
          onClick={() => setEditMode(!editMode)}
          disabled={visibleLayout.length === 0}
        >
          <BasicIcon icon={editMode ? "Tick02Icon" : "Edit02Icon"} size={16} />
          {editMode ? "Done" : "Arrange"}
        </BaseButton>

        <div className="addMenu" ref={menuRef}>
          <BaseButton size="sm" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} disabled={available.length === 0}>
            <BasicIcon icon="PlusSignIcon" size={16} />
            Add widget
          </BaseButton>
          {menuOpen && (
            <div className="addMenu__panel" role="menu">
              {available.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  role="menuitem"
                  className="addMenu__item"
                  onClick={() => {
                    setMenuOpen(false);
                    addWidget(option.type);
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

      {editMode && (
        <p className="arrangeHint" role="status">
          <BasicIcon icon="Edit02Icon" size={16} />
          <span>
            <strong>Arranging.</strong> Drag a card to move it, pull a <b>corner</b> or <b>edge</b> to resize it, and pick a colour on the card. Press <b>Done</b> when finished.
          </span>
        </p>
      )}

      <div className={`board ${editMode ? "is-arranging" : ""}`} ref={boardRef}>
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
              resizeHandles={["se", "sw", "e", "w", "s"]}
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
