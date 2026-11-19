"use client";
import { memo } from "react";
import BasicIcon from "@/app/components/ultis/icons";
import { dismissToast, useNotifications, type Toast } from "@/app/utils/notifications/store";
import { SOURCE_ICON, SOURCE_NAME } from "./sourceIcon";
import { useOpenNotification } from "./useOpenNotification";
import { Button } from "@/app/components/ui";

// The cards that slide in while you are looking at the page. Each one counts down on its own (a thin line shrinks; pointing at it or
// tabbing into it pauses the count) and leaves by itself, but never leaves the bell: closing a card does not delete the notification.

const ToastCard = memo(function ToastCard({ toast, open }: { toast: Toast; open: ReturnType<typeof useOpenNotification> }) {
  const { item } = toast;
  const label = item.label ?? SOURCE_NAME[item.source];
  const go = () => {
    open(item);
    dismissToast(toast.key);
  };
  return (
    <li className={`toast is-${item.source}`}>
      <Button variant="bare" className="toast__main" onClick={go}>
        <span className="toast__icon" aria-hidden>
          <BasicIcon icon={SOURCE_ICON[item.source]} size={20} />
        </span>
        <span className="toast__text">
          <span className="toast__from">{label}</span>
          <strong className="toast__title">{item.title}</strong>
          {item.body && <span className="toast__body">{item.body}</span>}
        </span>
      </Button>
      <Button variant="bare" className="toast__close" onClick={() => dismissToast(toast.key)} aria-label="Dismiss">
        <BasicIcon icon="Cancel01Icon" size={14} />
      </Button>
      <span className="toast__bar" aria-hidden onAnimationEnd={() => dismissToast(toast.key)} />
    </li>
  );
});

export default function Toasts() {
  const toasts = useNotifications((state) => state.toasts);
  const open = useOpenNotification();
  return (
    <ul className="toasts" aria-live="polite" aria-label="New notifications">
      {toasts.map((toast) => (
        <ToastCard key={toast.key} toast={toast} open={open} />
      ))}
    </ul>
  );
}
