import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserStore } from "@/app/types/user";
import { UserState } from "@/app/types/user";

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      fetched: false,

      setUser: (user) => set({ user, loading: false, fetched: true }),

      setLoading: (loading) => set({ loading }),

      setFetched: (fetched) => set({ fetched }),

      // Add a fetch user method
      fetchUser: async () => {
        const { fetched } = get();
        if (fetched) return;

        set({ loading: true });
        try {
          const response = await fetch("/api/user");
          if (response.ok) {
            const userData = await response.json();
            set({ user: userData, loading: false, fetched: true });
          } else {
            set({ user: null, loading: false, fetched: true });
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          set({ user: null, loading: false, fetched: true });
        }
      },

      // Add logout method to clear persisted data
      logout: () => set({ user: null, loading: false, fetched: false }),
    }),
    {
      name: "user-storage", // Storage key name
      partialize: (state) => ({
        user: state.user,
        fetched: state.fetched,
      }), // Only persist user and fetched state
    }
  )
);
