import { create } from "zustand";
import {
  applyPreferences,
  cleanPreferences,
  DEFAULT_PREFERENCES,
  Preferences,
  STORAGE_KEY,
} from "@/app/utils/preferences";

interface PreferencesState {
  prefs: Preferences;
  // Where the last change came from: only local edits are sent to the server.
  origin: "local" | "server" | "init";
  update: (changes: Partial<Preferences>) => void;
  reset: () => void;
  // Called once the signed-in profile arrives: the account's saved look wins over this device's cache.
  hydrateFromServer: (remote: unknown) => void;
  init: () => void;
}

const remember = (prefs: Preferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode / storage full: the account copy still works */
  }
};

// Preferences are cosmetic, so they are cached on the device (instant, works logged out) and mirrored to the account.
export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  prefs: DEFAULT_PREFERENCES,
  origin: "init",

  init: () => {
    let stored: unknown = null;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      /* ignore a corrupted value */
    }
    const prefs = cleanPreferences(stored);
    applyPreferences(prefs);
    set({ prefs, origin: "init" });
  },

  update: (changes) => {
    const prefs = cleanPreferences({ ...get().prefs, ...changes });
    applyPreferences(prefs);
    remember(prefs);
    set({ prefs, origin: "local" });
  },

  reset: () => get().update({ ...DEFAULT_PREFERENCES, displayName: get().prefs.displayName }),

  hydrateFromServer: (remote) => {
    // An account that never saved anything yet keeps this device's choices (they will be uploaded on the next change).
    if (!remote || typeof remote !== "object" || Object.keys(remote).length === 0) return;
    const prefs = cleanPreferences({ ...get().prefs, ...(remote as object) });
    applyPreferences(prefs);
    remember(prefs);
    set({ prefs, origin: "server" });
  },
}));
