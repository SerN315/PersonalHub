"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type WidgetProps from "@/app/types/widget";
import type { IconName } from "@/app/components/ultis/icons";
import type { Tint } from "@/app/utils/preferences";

// THE list of widgets. Adding one means adding one entry here (plus its type in the backend's allow-list,
// PersonalHub-Back/src/http/validate.js): the menu, the starting size, the resize limits, the colour and the
// component all come from this entry, so nothing else in the dashboard needs to know the widget exists.

export interface WidgetSize {
  // Starting size and the range it can be resized to, in grid cells (about 77 px wide and 100 px tall on a desktop).
  w: number;
  h: number;
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
}

export interface WidgetDefinition {
  type: string; // stored in the database, so it never changes once shipped
  name: string;
  blurb: string; // one line in the "Add widget" menu
  icon: IconName;
  tint: Tint; // the card colour before the person picks one
  size: WidgetSize;
  page?: { href: string; label: string }; // a widget that also has a full page gets a link in the side menu
  component: ComponentType<WidgetProps>;
}

const Loading = () => <div className="widgetSkeleton" aria-busy="true" />;

// Every widget is its own chunk: it is downloaded only if it is on your dashboard, not for everyone.
const loaders = new Map<ComponentType<WidgetProps>, () => Promise<unknown>>();
const lazy = (load: () => Promise<{ default: ComponentType<WidgetProps> }>) => {
  const component = dynamic(load, { loading: Loading });
  loaders.set(component, load);
  return component;
};

// The minimums are the smallest sizes where each widget still does its job, found by resizing it cell by cell and
// checking that its content stays inside and usable. The maximums are generous because content scales up with the card.
export const WIDGETS: readonly WidgetDefinition[] = [
  {
    type: "clock",
    name: "Clock",
    blurb: "Time at a glance",
    icon: "ClockIcon",
    tint: "paper",
    size: { w: 3, h: 3, minW: 2, minH: 2, maxW: 8, maxH: 8 }, // the face scales to any size; 2x2 is the smallest that stays readable
    component: lazy(() => import("@/app/components/widgets/watch")),
  },
  {
    type: "todo",
    name: "To-do list",
    blurb: "Little things to do",
    icon: "TaskDone01Icon",
    tint: "paper",
    size: { w: 4, h: 5, minW: 2, minH: 3, maxW: 8, maxH: 12 }, // 2 wide x 3 tall still shows the header, a task or two and "Add a task"
    page: { href: "/todo", label: "Planner" },
    component: lazy(() => import("@/app/components/widgets/todolist")),
  },
  {
    type: "sticky",
    name: "Sticky note",
    blurb: "Jot something down",
    icon: "StickyNoteIcon",
    tint: "butter",
    size: { w: 3, h: 3, minW: 2, minH: 1, maxW: 12, maxH: 12 }, // from a one-line strip to a full-width page
    page: { href: "/notes", label: "Notes" },
    component: lazy(() => import("@/app/components/widgets/stickyNotes")),
  },
  {
    type: "pomodoro",
    name: "Pomodoro",
    blurb: "Focus in short bursts",
    icon: "AlarmClockIcon",
    tint: "peach",
    size: { w: 3, h: 3, minW: 2, minH: 2, maxW: 8, maxH: 8 }, // the mode tabs shorten when narrow; the dial still reads at 2x2
    page: { href: "/focus", label: "Focus" },
    component: lazy(() => import("@/app/components/widgets/podoromoWidget")),
  },
  {
    type: "radio",
    name: "Radio",
    blurb: "Internet radio and YouTube playlists",
    icon: "Radio01Icon",
    tint: "paper", // it is a wooden radio, not a card: the colour picker is off for it
    size: { w: 5, h: 4, minW: 3, minH: 3, maxW: 12, maxH: 10 }, // plain radio works from 3 x 3; YouTube's player needs about 5 x 4 and says so when it has less
    page: { href: "/radio", label: "Radio" },
    component: lazy(() => import("@/app/components/widgets/radio/RadioWidget")),
  },
  {
    type: "weather",
    name: "Weather",
    blurb: "The sky outside",
    icon: "SunCloud01Icon",
    tint: "paper",
    size: { w: 5, h: 3, minW: 2, minH: 2, maxW: 12, maxH: 6 }, // the hourly strip appears once there is room; a small one is just sky and temperature
    component: lazy(() => import("@/app/components/widgets/weather")),
  },
];

const byType = new Map(WIDGETS.map((definition) => [definition.type, definition]));

// Starts downloading a widget's code ahead of time (when you point at the thing that opens it), so it appears at once. Safe to call
// again and again: the browser only fetches it once.
export const preloadWidget = (type: string) => {
  const definition = byType.get(type);
  if (definition) void loaders.get(definition.component)?.();
};

// undefined for a type this version does not know (for example one added by a newer version of the app).
export const getWidgetDefinition = (type: string) => byType.get(type);

export const COLS = 12;

// A widget saved at a size outside its range (an old, too-small one) is brought back inside it.
export function clampSize(type: string, size: { w: number; h: number }) {
  const definition = byType.get(type);
  if (!definition) return size;
  const { minW, minH, maxW, maxH } = definition.size;
  return { w: Math.min(Math.max(size.w, minW), maxW), h: Math.min(Math.max(size.h, minH), maxH) };
}

// The limits react-grid-layout enforces while dragging a resize grip.
export function resizeLimits(type: string) {
  const definition = byType.get(type);
  if (!definition) return {};
  const { minW, minH, maxW, maxH } = definition.size;
  return { minW, minH, maxW, maxH };
}
