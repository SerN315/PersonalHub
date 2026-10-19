import type { Metadata, Viewport } from "next";
import { Courier_Prime, Fraunces, Nunito } from "next/font/google";
import { headers } from "next/headers";
import "@/app/globals.css";
import "@/app/styles/layouts/shell.scss";
import { Nav } from "@/app/components/layouts/Nav";
import { EditModeProvider } from "@/app/contexts/editWidgetContext";
import PreferencesRegistry from "./contexts/PreferencesRegistry";
import UserRegistry from "./contexts/UserRegistry";
import { EARLY_PAINT_SCRIPT } from "./utils/preferences";

// Self-hosted by Next at build time. A face is only downloaded once something uses it, so the two
// alternative fonts cost nothing until a person picks them in Settings.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "PersonalHub",
  description: "A cozy corner for your day: clock, todos, sticky notes, pomodoro and weather.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5ede0" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1713" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Rendered per request: the proxy's CSP nonce has to reach every script tag, including the early-paint one below.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable} ${courier.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: EARLY_PAINT_SCRIPT }} />
      </head>
      <body>
        <PreferencesRegistry />
        <EditModeProvider>
          <div className="appShell">
            <Nav />
            <main className="appShell__main">
              <UserRegistry>{children}</UserRegistry>
            </main>
          </div>
        </EditModeProvider>
      </body>
    </html>
  );
}
