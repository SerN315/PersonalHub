import { create } from "zustand";
import { UserState } from "@/app/types/user";

// Deliberately NOT persisted: who is signed in is decided by the server on every load, never by localStorage.
export const useUserStore = create<UserState>()((set) => ({
  user: null,
  loading: false,
  fetched: false,

  setUser: (user) => set({ user, loading: false, fetched: true }),
  setLoading: (loading) => set({ loading }),
  setFetched: (fetched) => set({ fetched }),
}));
