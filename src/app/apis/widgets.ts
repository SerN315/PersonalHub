import { api } from "./http";
import { asRecord } from "@/app/utils/widgetData";

export { asRecord };
import type { Widget } from "@/app/types/widgets";

type Position = { x: number; y: number; w: number; h: number };

// The server knows who you are from the session cookie: no user id travels in any URL or body.

const clean = (widget: Widget): Widget => ({ ...widget, data: asRecord(widget.data) });

export const getUserWidgets = async () => (await api<Widget[]>("/api/widgets")).map(clean);

export const createWidget = async (widget: { type: string; position: Position; data?: object }) =>
  clean(await api<Widget>("/api/widgets", { method: "POST", body: widget }));

export const updateWidget = (widgetId: string, changes: { position?: Position; data?: object }) =>
  api<Widget>(`/api/widgets/${encodeURIComponent(widgetId)}`, { method: "PUT", body: changes });

export const deleteWidget = (widgetId: string) =>
  api<null>(`/api/widgets/${encodeURIComponent(widgetId)}`, { method: "DELETE" });

export const saveUserWidgetLayout = (
  layout: Array<{ i: string } & Position>,
  widgetStates: Record<string, { visible: boolean; minimized: boolean }>
) => api("/api/widgets/layout", { method: "POST", body: { layout, widgetStates } });

export const deleteAllUserWidgets = () => api<null>("/api/widgets", { method: "DELETE" });
