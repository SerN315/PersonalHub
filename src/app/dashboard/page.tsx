import dynamic from "next/dynamic";
import "../styles/pages/dashboard.scss";

// My day is browser-only (it measures its own width, remembers which view you were in, and talks to the API with your cookies).
const MyDay = dynamic(() => import("./MyDay"));

export default function DashboardPage() {
  return <MyDay />;
}
