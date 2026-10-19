import type { Metadata } from "next";
import { connection } from "next/server";
import "@/app/globals.css";
import { Nav } from "@/app/components/layouts/Nav";
import { EditModeProvider } from "@/app/contexts/editWidgetContext";
import ThemeRegistry from "./contexts/ThemeRegistry";
import UserRegistry from "./contexts/UserRegistry";

export const metadata: Metadata = {
  title: "PersonalHub",
  description: "Your personal dashboard: clock, todos, sticky notes, pomodoro and weather in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Render per request so the proxy's CSP nonce reaches every script tag (static pages could not carry one).
  await connection();
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Nav />
        <main className="flex-1">
          <ThemeRegistry>
            <UserRegistry>
              <EditModeProvider>{children}</EditModeProvider>
            </UserRegistry>
          </ThemeRegistry>
        </main>
      </body>
    </html>
  );
}
