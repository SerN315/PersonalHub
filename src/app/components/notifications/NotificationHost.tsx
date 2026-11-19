"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "@/app/styles/ui/notifications.scss";
import { useUserStore } from "@/app/utils/store/userStore";
import { startNotifications, useNotifications } from "@/app/utils/notifications/store";
import { titleWithCount } from "@/app/utils/notifications/alert";
import Toasts from "./Toasts";

// Mounted once for the whole app: starts looking for news when someone is signed in, shows the cards, and puts the unread number in the
// browser tab's title so you can see it from another tab.
export default function NotificationHost() {
  const signedIn = useUserStore((state) => state.user !== null);
  const unread = useNotifications((state) => state.unread);
  const pathname = usePathname();

  useEffect(() => (signedIn ? startNotifications() : undefined), [signedIn]);

  useEffect(() => {
    const next = titleWithCount(document.title, signedIn ? unread : 0);
    if (next !== document.title) document.title = next;
  }, [unread, signedIn, pathname]);

  if (!signedIn || pathname.startsWith("/auth/")) return null;
  return <Toasts />;
}
