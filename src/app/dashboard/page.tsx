import dynamic from "next/dynamic";
import WidgetShell from "./dasboardComponents/widgetShell";

// Lazy load the client-only component
const WidgetClient = dynamic(() => import("./dasboardComponents/widgetClient"), {

});

export default async function DashboardPage() {
  const initialLayout = [
    { i: "sticky", x: 0, y: 0, w: 4, h: 1 },
    { i: "todo", x: 4, y: 0, w: 4, h: 1 },
    { i: "weather", x: 8, y: 0, w: 4, h: 1 },
    { i: "pomodoro", x: 0, y: 3, w: 2, h: 1, minW:2},
    { i: "clock", x: 4, y: 3, w: 4, h: 2, minW:3, minH: 2 },
  ];

  return (
    <div className="p-6">
      <WidgetClient layout={initialLayout} />
    </div>
  );
}
