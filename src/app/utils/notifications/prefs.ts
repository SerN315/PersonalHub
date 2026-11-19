"use client";
import { createLocalStore } from "@/app/utils/localStore";
import { DEFAULT_PREFS, cleanPrefs } from "./alert";

// How notifications show up ON THIS DEVICE (a phone and a laptop can differ), kept in the browser. Which kinds of news reach you at all
// is kept on your account instead (Settings > Notifications).
export const notificationPrefs = createLocalStore("personalhub:notification-prefs", cleanPrefs, DEFAULT_PREFS);
