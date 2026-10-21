import dynamic from "next/dynamic";

// The planner is browser-only (it talks to the API with your cookies and keeps its own live copy of your tasks).
const Planner = dynamic(() => import("@/app/components/todo/Planner"));

export const metadata = { title: "Planner" };

export default function TodoPage() {
  return <Planner />;
}
