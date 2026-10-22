"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createWidget, getUserWidgets, updateWidget } from "@/app/apis/widgets";
import { getWidgetDefinition } from "@/app/widgets/registry";
import type { Widget } from "@/app/types/widgets";

// The widget an object in the room opens is the very same widget as on your dashboard (one per type, as the server allows),
// so a note written here is the note on "My day". If you do not have that widget yet, `create` makes it the first time it is
// opened (it then also appears on your dashboard); without `create` the widget simply works without saving anything.

export interface RoomWidget {
  id: string;
  data: Record<string, unknown>;
  onData: (id: string, patch: Record<string, unknown>) => void;
  ready: boolean;
}

let widgetsPromise: Promise<Widget[]> | null = null;
const loadWidgets = () => (widgetsPromise ??= getUserWidgets().catch((error) => ((widgetsPromise = null), Promise.reject(error))));

export function useRoomWidget(type: string, { create = false }: { create?: boolean } = {}): RoomWidget {
  const [state, setState] = useState<{ id: string; data: Record<string, unknown>; saved: boolean } | null>(null);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let widget: Widget | undefined;
      try {
        widget = (await loadWidgets()).find((w) => w.type === type);
        if (!widget && create) {
          const size = getWidgetDefinition(type)?.size ?? { w: 3, h: 3 };
          widget = await createWidget({ type, position: { x: 0, y: 0, w: size.w, h: size.h } });
          widgetsPromise = null; // the list changed: the next look fetches it again
        }
      } catch {
        /* offline or signed out: the widget still works, it just does not save */
      }
      if (cancelled) return;
      setState(widget ? { id: widget.id, data: widget.data ?? {}, saved: true } : { id: `room-${type}`, data: {}, saved: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [type, create]);

  const onData = useCallback((_id: string, patch: Record<string, unknown>) => {
    const current = latest.current;
    if (!current) return;
    const data = { ...current.data, ...patch };
    setState({ ...current, data });
    if (current.saved) void updateWidget(current.id, { data }).catch(() => {});
  }, []);

  return { id: state?.id ?? `room-${type}`, data: state?.data ?? {}, onData, ready: state !== null };
}
