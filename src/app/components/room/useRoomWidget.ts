"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { asRecord, createWidget, getUserWidgets, updateWidget } from "@/app/apis/widgets";
import { getWidgetDefinition } from "@/app/widgets/registry";

// The widget an object in the room opens is the very same widget as on your dashboard (one per type, as the server allows),
// so a note written here is the note on "My day". If you do not have that widget yet, `create` makes it the first time it is
// opened (it then also appears on your dashboard); without `create` the widget simply works without saving anything.
//
// Your widgets are listed once and kept (and kept up to date by every save made here), so a widget opens with its data already in
// hand. `warmRoomWidgets` lists them ahead of time, as soon as the room is up.

export interface RoomWidget {
  id: string;
  data: Record<string, unknown>;
  onData: (id: string, patch: Record<string, unknown>) => void;
  ready: boolean;
}

interface Entry {
  id: string;
  data: Record<string, unknown>;
  saved: boolean; // false: you have no such widget, so changes are not stored
}

const cache = new Map<string, Entry>();
let listing: Promise<void> | null = null;

const loadList = () =>
  (listing ??= getUserWidgets()
    .then((widgets) => {
      for (const widget of widgets) cache.set(widget.type, { id: widget.id, data: widget.data ?? {}, saved: true });
    })
    .catch(() => {
      listing = null; // offline or signed out: the next open tries again
    }));

export const warmRoomWidgets = () => void loadList();

async function resolve(type: string, create: boolean): Promise<Entry> {
  await loadList();
  let entry = cache.get(type);
  if (!entry && create) {
    try {
      const size = getWidgetDefinition(type)?.size ?? { w: 3, h: 3 };
      const widget = await createWidget({ type, position: { x: 0, y: 0, w: size.w, h: size.h } });
      entry = { id: widget.id, data: widget.data ?? {}, saved: true };
      cache.set(type, entry);
    } catch {
      /* it still works, it just does not save */
    }
  }
  return entry ?? { id: `room-${type}`, data: {}, saved: false };
}

export function useRoomWidget(type: string, { create = false }: { create?: boolean } = {}): RoomWidget {
  const [entry, setEntry] = useState<Entry | null>(() => cache.get(type) ?? null);
  const latest = useRef(entry);
  useEffect(() => {
    latest.current = entry;
  });

  useEffect(() => {
    if (cache.has(type)) return;
    let cancelled = false;
    void resolve(type, create).then((found) => !cancelled && setEntry(found));
    return () => {
      cancelled = true;
    };
  }, [type, create]);

  const onData = useCallback(
    (_id: string, patch: Record<string, unknown>) => {
      const current = latest.current;
      if (!current) return;
      const next = { ...current, data: { ...asRecord(current.data), ...patch } };
      setEntry(next);
      if (current.saved) {
        cache.set(type, next);
        void updateWidget(current.id, { data: next.data }).catch(() => {});
      }
    },
    [type],
  );

  return { id: entry?.id ?? `room-${type}`, data: entry?.data ?? {}, onData, ready: entry !== null };
}
