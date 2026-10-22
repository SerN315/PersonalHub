// The things in the Weather tab that open one of your widgets: the same list drives the room scene and the phone layout.
// A sprite carries no label; its job is its accessible name. `create` makes the widget the first time it is opened if you have none.
export const PROPS = [
  { widget: "clock", src: "/room/clock.png", className: "room__clock", label: "Open the clock", depth: 5 },
  { widget: "todo", src: "/room/calendar.png", className: "room__calendar", label: "Open your to-do list", depth: 5 },
  { widget: "sticky", src: "/room/sticky.png", className: "room__sticky", label: "Open your sticky note", depth: 9, create: true },
  { widget: "radio", src: "/room/radio.png", className: "room__radio", label: "Open the radio", depth: 14, create: true },
] as const;

export type RoomProp = (typeof PROPS)[number];
