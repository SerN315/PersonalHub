"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BasicIcon from "../ultis/icons";
import { SettingsModal } from "../settings/settings";
import { useUserStore } from "@/app/utils/store/userStore";
import { logoutUser } from "@/app/apis/settings";
import type * as Icons from "@hugeicons/core-free-icons";
import type { SettingsTab } from "@/app/types/settings";

const LINKS: { href: string; label: string; icon: keyof typeof Icons }[] = [
  { href: "/", label: "Welcome", icon: "Home03Icon" },
  { href: "/dashboard", label: "My day", icon: "DashboardSquare01Icon" },
  { href: "/dictionary", label: "Dictionary", icon: "BookOpen01Icon" },
];

export const Nav: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [settingsTab, setSettingsTab] = React.useState<SettingsTab | null>(null);
  const pathname = usePathname();

  if (pathname.startsWith("/auth/")) return null;

  const signOut = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      window.location.href = "/auth/login";
    }
  };

  const displayName = user?.name || user?.username || "Guest";

  return (
    <>
      <nav className="nav" aria-label="Main">
        <div className="nav__top">
          <Link href="/dashboard" className="nav__brand">
            <span className="nav__brandMark" aria-hidden>
              <BasicIcon icon="Coffee01Icon" size={20} />
            </span>
            <span className="nav__brandName">PersonalHub</span>
          </Link>

          <button type="button" className="nav__user" onClick={() => setSettingsTab("Profile")} aria-label="Open your profile settings">
            <span
              className="nav__avatar"
              style={{ backgroundImage: `url(${user?.avatar_url || "/Blank-Avatar.webp"})` }}
              aria-hidden
            />
            <span className="nav__userText">
              <span className="nav__userName">{displayName}</span>
              <span className="nav__userMail">{user?.email || "Not signed in"}</span>
            </span>
          </button>

          <ul className="nav__links">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link href={link.href} className={`nav__link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                    <BasicIcon icon={link.icon} size={20} />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="nav__bottom">
          <button type="button" className="nav__link" id="settingButton" onClick={() => setSettingsTab("Appearance")}>
            <BasicIcon icon="PaintBoardIcon" size={20} />
            <span>Make it yours</span>
          </button>
          <button type="button" className="nav__link" id="settingsAccountButton" onClick={() => setSettingsTab("Profile")}>
            <BasicIcon icon="Settings02Icon" size={20} />
            <span>Settings</span>
          </button>
          {user && (
            <button type="button" className="nav__link" id="logoutButton" onClick={signOut}>
              <BasicIcon icon="Logout01Icon" size={20} />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </nav>

      <SettingsModal open={settingsTab !== null} initialTab={settingsTab ?? "Profile"} onClose={() => setSettingsTab(null)} />
    </>
  );
};
