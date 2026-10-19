import { redirect } from "next/navigation";

// The dashboard is the home page; the proxy sends visitors without a session on to the login page.
export default function Home() {
  redirect("/dashboard");
}
