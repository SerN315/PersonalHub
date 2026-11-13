import { api } from "./http";

// The owner's switches. Anyone else gets a 403 from these, which is how the page knows not to show them.

export type SearchAccess = "admin" | "host" | "everyone";

export interface AdminSettings {
  searchAccess: SearchAccess;
  searchAccessChoices: SearchAccess[];
  search: { configured: boolean; used: number; limit: number; remaining: number };
}

export const getAdminSettings = () => api<AdminSettings>("/api/admin/settings");
export const setSearchAccess = (searchAccess: SearchAccess) => api<AdminSettings>("/api/admin/settings", { method: "PUT", body: { searchAccess } });
