"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/app/apis/notifications";
import { whereTo } from "@/app/utils/notifications/alert";
import { readOne, setPanel } from "@/app/utils/notifications/store";

// What happens when someone chooses a notification: it counts as read, and its link (inside the app, or a secure web address) is followed.
export function useOpenNotification() {
  const router = useRouter();
  return useCallback(
    (item: NotificationItem) => {
      if (!item.id.startsWith("many-")) void readOne(item.id);
      const target = whereTo(item.link);
      if (target?.kind === "app") {
        setPanel(false);
        router.push(target.path);
      } else if (target?.kind === "web") window.open(target.url, "_blank", "noopener,noreferrer");
    },
    [router],
  );
}
