import dynamic from "next/dynamic";

// Browser-only: the radio plays sound and remembers recent stations in this browser.
const RadioDesk = dynamic(() => import("@/app/components/radio/RadioDesk"));

export const metadata = { title: "Radio" };

export default function RadioPage() {
  return <RadioDesk />;
}
