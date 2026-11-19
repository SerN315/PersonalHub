"use client";
import BasicIcon from "@/app/components/ultis/icons";
import { setPanel, useNotifications } from "@/app/utils/notifications/store";

// The bell in the sidebar (and the bottom bar on a phone). The number is what you have not looked at yet.
export default function NotificationBell() {
  const unread = useNotifications((state) => state.unread);
  const open = useNotifications((state) => state.panelOpen);
  return (
    <button
      type="button"
      className={`nav__link nav__bell ${open ? "is-active" : ""}`}
      data-notification-bell
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      aria-expanded={open}
      aria-controls="notification-panel"
      onClick={() => setPanel(!open)}
    >
      <span className="nav__bellIcon">
        <BasicIcon icon="Notification02Icon" size={20} />
        {unread > 0 && (
          <span className="nav__badge" aria-hidden>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </span>
      <span>Notifications</span>
    </button>
  );
}
