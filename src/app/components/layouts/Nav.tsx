"use client";
import React from "react";
import NavLinkItem from "../ui/navLinkItems";
import "@/app/styles/layouts/Nav.scss";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SettingsModal } from "../settings/settings";
import { useThemeStore } from "@/app/utils/store/ThemeStore";
import { useUserStore } from "@/app/utils/store/userStore";
import { logoutUser } from "@/app/apis/settings";

export const Nav: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const { user, logout } = useUserStore();
  const router = useRouter();
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/auth/login") || pathname.includes("/auth/register");

  React.useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      logout();
      closeMobileMenu();
      router.replace("/auth/login");
      router.refresh();
    }
  };

  return hideNav ? null : (
    <>
      <button
        type="button"
        className={`hamburger ${isMobileMenuOpen ? "active" : ""}`}
        aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav className={`nav ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="topHalf">
          <div className="nav-user">
            <div className="user__container">
              <Link className="user__link" href="/">
                <div className="userInfo">
                  <div
                    className="user__image"
                    style={{
                      backgroundImage: user
                        ? `url(${user.avatar_url})`
                        : "url('/motivation.jpg')",
                    }}
                  ></div>
                  <div className="user__texts">
                    <h2 className="userName">{user?.username || "UserName"}</h2>
                    <h3 className="email">{user?.email || "Email@gmail.com"}</h3>
                  </div>
                </div>
              </Link>
              <div className="interactiveButtons"></div>
            </div>
          </div>
          <div className="nav-controller">
            <div className="nav-controller__search"></div>
          </div>
          <div className="nav-lists">
            <ul className="nav-list_menu">
              <h1 className="menu-title">PAGES</h1>

              <NavLinkItem
                label="Home"
                href="/"
                isActive={false}
                iconName="Home03Icon"
                onclick={closeMobileMenu}
              />

              <NavLinkItem
                label="DashBoard"
                href="/dashboard"
                isActive={false}
                iconName="DashboardCircleAddIcon"
                onclick={closeMobileMenu}
              />

              {!user && (
                <NavLinkItem
                  label="Login"
                  href="/auth/login"
                  isActive={false}
                  onclick={closeMobileMenu}
                />
              )}
            </ul>
            <ul className="nav-list_widgetMenu">
              <h1 className="menu-title">FEATURES</h1>

              <NavLinkItem
                label="Weather"
                href="/"
                isActive={false}
                iconName="CloudIcon"
                onclick={closeMobileMenu}
              />

              <NavLinkItem
                label="To-do"
                href="/dashboard"
                isActive={false}
                iconName="TaskDone01Icon"
                onclick={closeMobileMenu}
              />

              <NavLinkItem
                label="Pomodoro"
                href="/auth/login"
                isActive={false}
                iconName="AlarmClockIcon"
                onclick={closeMobileMenu}
              />

              <NavLinkItem
                label="Clock"
                href="/"
                isActive={false}
                iconName="ClockIcon"
                onclick={closeMobileMenu}
              />

              <NavLinkItem
                label="Sticky Notes"
                href="/"
                isActive={false}
                iconName="StickyNoteIcon"
                onclick={closeMobileMenu}
              />

              <NavLinkItem
                label="Dictionary"
                href="/dictionary"
                isActive={false}
                iconName="BookOpen01Icon"
                onclick={closeMobileMenu}
              />
            </ul>
            <ul className="nav-list_menu">
              <h1 className="menu-title">DOCUMENTS</h1>
            </ul>
          </div>
        </div>
        <div className="quickOptions">
          {user && (
            <>
              <NavLinkItem
                label="Settings"
                href="#"
                isActive={false}
                id="settingButton"
                iconName="SettingsIcon"
                onclick={() => {
                  setShowSettingsModal(true);
                  closeMobileMenu();
                }}
              />
              <NavLinkItem
                label="Logout"
                href="#"
                isActive={false}
                id="logoutButton"
                iconName="LogoutIcon"
                onclick={handleLogout}
              />
            </>
          )}
          {showSettingsModal && (
            <SettingsModal
              theme={theme}
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              onSave={() => {
                setShowSettingsModal(false);
              }}
            />
          )}
        </div>
      </nav>
    </>
  );
};
