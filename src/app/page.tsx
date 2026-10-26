import { redirect } from "next/navigation";

// The old welcome page became the Help page (/help). Anyone who lands on the front door is sent there; signed-in people reach
// everything else from the menu.
export default function Home() {
  redirect("/help");
}
