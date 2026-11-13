export type SettingsTab = "Profile" | "Appearance" | "Security" | "Admin";

export interface SettingsModalProps {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
}
