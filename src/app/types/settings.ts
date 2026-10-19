export type SettingsTab = "Profile" | "Appearance" | "Security";

export interface SettingsModalProps {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
}
