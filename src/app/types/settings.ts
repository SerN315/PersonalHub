export type SettingsTab = "Profile" | "Appearance" | "Security" | "Notifications" | "Admin";

export interface SettingsModalProps {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
}
