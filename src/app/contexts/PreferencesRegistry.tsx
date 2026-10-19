"use client";

import { useEffect } from "react";
import { usePreferencesStore } from "@/app/utils/store/preferencesStore";
import { useUserStore } from "@/app/utils/store/userStore";
import { updateUser } from "@/app/apis/settings";
import { applyPreferences } from "@/app/utils/preferences";

const SAVE_DELAY_MS = 800;

// Renders nothing. Keeps the page's look in step with the store, follows the system theme, and saves changes to the account.
export default function PreferencesRegistry() {
  useEffect(() => {
    usePreferencesStore.getState().init();

    // "System" mode follows the OS live.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const { prefs } = usePreferencesStore.getState();
      if (prefs.mode === "system") applyPreferences(prefs);
    };
    media.addEventListener("change", onSystemChange);

    // Debounced upload of local edits (slider-like pickers can fire many changes quickly).
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = usePreferencesStore.subscribe((state, previous) => {
      if (state.prefs === previous.prefs || state.origin !== "local") return;
      if (!useUserStore.getState().user) return; // logged out: the device copy is enough
      clearTimeout(timer);
      timer = setTimeout(() => {
        updateUser({ preferences: usePreferencesStore.getState().prefs }).catch(() => {
          /* offline: it stays on this device and is uploaded with the next change */
        });
      }, SAVE_DELAY_MS);
    });

    return () => {
      media.removeEventListener("change", onSystemChange);
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return null;
}
