"use client";
import React from "react";
import NavLinkItem from "../ui/navLinkItems";
import "@/app/styles/layouts/Nav.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsModal } from "../settings/settings";
import { useThemeStore } from "@/app/utils/store/ThemeStore";
import { useUserStore } from "@/app/utils/store/userStore";
import { fetchUser } from "@/app/apis/settings";

export const Nav: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const { user, fetched } = useUserStore();
  React.useEffect(() => {
    if (!fetched) {
      fetchUser();
    }
  }, [fetched]); // fetchUser is external function, not a dependency
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/auth/login") || pathname.includes("/auth/register");
  return hideNav ? null : (
    <nav className="nav">
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
            />

            <NavLinkItem
              label="DashBoard"
              href="/dashboard"
              isActive={false}
              iconName="DashboardCircleAddIcon"
            />

            <NavLinkItem label="Login" href="/auth/login" isActive={false} />
          </ul>
          <ul className="nav-list_widgetMenu">
            <h1 className="menu-title">FEATURES</h1>

            <NavLinkItem
              label="Weather"
              href="/"
              isActive={false}
              iconName="CloudIcon"
            />

            <NavLinkItem
              label="To-do"
              href="/dashboard"
              isActive={false}
              iconName="TaskDone01Icon"
            />

            <NavLinkItem
              label="Pomodoro"
              href="/auth/login"
              isActive={false}
              iconName="AlarmClockIcon"
            />

            <NavLinkItem
              label="Clock"
              href="/"
              isActive={false}
              iconName="ClockIcon"
            />

            <NavLinkItem
              label="Sticky Notes"
              href="/"
              isActive={false}
              iconName="StickyNoteIcon"
            />

            <NavLinkItem
              label="Calendar"
              href="/"
              isActive={false}
              iconName="CalendarIcon"
            />
          </ul>
          <ul className="nav-list_menu">
            <h1 className="menu-title">DOCUMENTS</h1>
          </ul>
        </div>
      </div>
      <div className="quickOptions">
        <NavLinkItem
          label="Settings"
          href="#"
          isActive={false}
          id="settingButton"
          iconName="SettingsIcon"
          onclick={() => setShowSettingsModal(true)}
        />
        <NavLinkItem
          label="Logout"
          href="/"
          isActive={false}
          id="logoutButton"
          iconName="LogoutIcon"
        />
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
  );
};
