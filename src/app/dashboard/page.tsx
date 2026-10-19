import dynamic from "next/dynamic";
import "../styles/pages/dashboard.scss";

// The board is browser-only (it measures its own width and talks to the API with your cookies).
const WidgetClient = dynamic(() => import("./dasboardComponents/widgetClient"));

export default function DashboardPage() {
  return <WidgetClient />;
}
