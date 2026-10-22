import dynamic from "next/dynamic";

// Browser-only: it asks for your location and talks to the API with your cookies.
const WeatherRoom = dynamic(() => import("@/app/components/room/WeatherRoom"));

export const metadata = { title: "Weather" };

export default function WeatherPage() {
  return <WeatherRoom />;
}
