export type SettingsTab = "Profile" | "Account";

export interface SettingsFormData {
  username: string;
  email: string;
  language: string;
  image?: File | null;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SettingsFormData) => void;
  initialData?: SettingsFormData;
  theme?: string;
}

export interface SettingAccountProps {
  data: SettingsFormData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: keyof SettingsFormData, value: any) => void;
}

export interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
}
