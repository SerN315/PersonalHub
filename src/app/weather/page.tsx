import { redirect } from "next/navigation";

// The weather room is now the "Room" view of My day. Old links and bookmarks to /weather land there.
export default function WeatherPage() {
  redirect("/dashboard?view=room");
}
