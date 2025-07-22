// stores/useUserStore.ts
import { create } from "zustand";
import { UserStore } from "@/app/types/user";
import { UserState } from "@/app/types/user";

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,
  fetched: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setFetched: (fetched) => set({ fetched }),
}));
