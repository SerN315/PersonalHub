import { api } from "./http";
import type { Preferences } from "@/app/utils/preferences";

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  preferences: Partial<Preferences>;
}

// The signed-in profile; rejects with a 401 ApiError when there is no valid session.
export const fetchUser = () => api<Profile>("/api/auth/user");

export const updateUser = (updates: {
  username?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  preferences?: Preferences;
}) => api<{ user: Profile; emailChangePending: boolean }>("/api/update-profile", { method: "PATCH", body: updates });

export const logoutUser = () => api("/api/logout", { method: "POST" });

export const uploadProfileImage = async (file: File) => {
  const form = new FormData();
  form.append("avatar", file);
  const data = await api<{ avatarUrl: string }>("/api/upload-avatar", { method: "PATCH", form });
  return data.avatarUrl;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const data = await api<{ message: string }>("/api/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
  return data.message;
};
