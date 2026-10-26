import dynamic from "next/dynamic";

// Browser-only: the timer remembers itself in this browser and saves finished sessions with your cookies.
const FocusDesk = dynamic(() => import("@/app/components/focus/FocusDesk"));

export const metadata = { title: "Focus" };

export default function FocusPage() {
  return <FocusDesk />;
}
