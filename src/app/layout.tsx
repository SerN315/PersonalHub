import type { Metadata } from "next";
import "@/app/globals.css";
import { Nav } from "@/app/components/layouts/Nav";
import { EditModeProvider } from "@/app/contexts/editWidgetContext";
import ThemeRegistry from "./contexts/ThemeRegistry";
import UserRegistry from "./contexts/UserRegistry";

export const metadata: Metadata = {
  title: "PersonalHub",
  description: "Your personal productivity dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
