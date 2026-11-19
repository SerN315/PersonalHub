"use client";
import { memo, useEffect, useRef, useState } from "react";
import BasicIcon from "@/app/components/ultis/icons";
import type { NotificationItem } from "@/app/apis/notifications";
import { timeAgo } from "@/app/utils/notifications/alert";
import { clearAll, readAll, removeOne, setPanel, useNotifications } from "@/app/utils/notifications/store";
import { SOURCE_ICON, SOURCE_NAME } from "./sourceIcon";
import { useOpenNotification } from "./useOpenNotification";

// The inbox that opens from the bell: newest first, unread ones marked, each can be opened or deleted.

const Row = memo(function Row({ item, now, open }: { item: NotificationItem; now: number; open: (item: NotificationItem) => void }) {
  return (
    <li className={`inboxRow is-${item.source} ${item.read ? "" : "is-unread"}`}>
      <button type="button" className="inboxRow__main" onClick={() => open(item)}>
        <span className="inboxRow__icon" aria-hidden>
          <BasicIcon icon={SOURCE_ICON[item.source]} size={18} />
        </span>
        <span className="inboxRow__text">
          <strong>{item.title}</strong>
          {item.body && <span className="inboxRow__body">{item.body}</span>}
          <small>
            {item.label ?? SOURCE_NAME[item.source]} · {timeAgo(item.created_at, now)}
            {!item.read && <span className="sr-only"> (unread)</span>}
          </small>
        </span>
      </button>
      <button type="button" className="inboxRow__remove" onClick={() => void removeOne(item.id)} aria-label={`Delete ${item.title}`}>
        <BasicIcon icon="Delete02Icon" size={15} />
      </button>
    </li>
  );
});

// Only mounted while open, so its clock starts fresh each time and nothing runs while it is closed.
export default function NotificationPanel({ onSettings }: { onSettings: () => void }) {
  const isOpen = useNotifications((state) => state.panelOpen);
  return isOpen ? <OpenPanel onSettings={onSettings} /> : null;
}

function OpenPanel({ onSettings }: { onSettings: () => void }) {
  const items = useNotifications((state) => state.items);
  const unread = useNotifications((state) => state.unread);
  const loaded = useNotifications((state) => state.loaded);
  const open = useOpenNotification();
  const ref = useRef<HTMLElement>(null);
  const [now, setNow] = useState(() => Date.now());

  // "5 min ago" keeps up while it is open
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    ref.current?.focus();
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const away = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !ref.current?.contains(target) && !target.closest("[data-notification-bell]")) setPanel(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPanel(false);
      document.querySelector<HTMLElement>("[data-notification-bell]")?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <section ref={ref} id="notification-panel" className="inbox" role="dialog" aria-label="Notifications" tabIndex={-1}>
      <header className="inbox__head">
        <h2>Notifications</h2>
        <div>
          <button type="button" className="inbox__link" onClick={() => void readAll()} disabled={unread === 0}>
            Mark all read
          </button>
          <button type="button" className="inbox__link" onClick={() => void clearAll()} disabled={items.length === 0}>
            Clear
          </button>
        </div>
      </header>
      {items.length === 0 ? (
        <div className="inbox__empty">
          <BasicIcon icon="Notification02Icon" size={28} />
          <p>{loaded ? "All quiet. Nothing new." : "Looking…"}</p>
        </div>
      ) : (
        <ul className="inbox__list">
          {items.map((item) => (
            <Row key={item.id} item={item} now={now} open={open} />
          ))}
        </ul>
      )}
      <footer className="inbox__foot">
        <button type="button" className="inbox__link" onClick={onSettings}>
          Choose what shows up here
        </button>
      </footer>
    </section>
  );
}
