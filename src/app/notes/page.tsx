import dynamic from "next/dynamic";

// Browser-only: it saves as you type, with your cookies.
const NotesDesk = dynamic(() => import("@/app/components/notes/NotesDesk"));

export const metadata = { title: "Notes" };

export default function NotesPage() {
  return <NotesDesk />;
}
