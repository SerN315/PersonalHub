import React, { useState } from "react";
import "@/app/styles/layouts/settings.scss";
import BaseIcon from "@/app/components/ultis/icons";
import SettingsSidebar from "./SettingSidebar";
import SettingsProfile from "./SettingAccount";
import SettingsAccount from "./GeneralSettings";
import {
  SettingsModalProps,
  SettingsTab,
  SettingsFormData,
} from "@/app/types/settings";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Profile");

  const [form, setForm] = useState<SettingsFormData>(
    initialData || { username: "", email: "", language: "en", image: null }
  );
  const userId = localStorage.getItem("userIdCookie");
  const handleChange = (key: keyof SettingsFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="modal-backdrop">
      <div className={`modal ${theme}`}>
        <div className="modal__header">
          <h2>Settings</h2>
          <div className="close-icon" onClick={onClose}>
            <BaseIcon icon="Cancel01Icon" />
          </div>
        </div>
        <hr />
        <div className="modal__content">
          <SettingsSidebar activeTab={activeTab} onSelect={setActiveTab} />
          <div className="vr"></div>
          <div className="modal__page__content">
            {activeTab === "Profile" && (
              <SettingsProfile data={form} onChange={handleChange} />
            )}
            {activeTab === "Account" && (
              <SettingsAccount data={form} onChange={handleChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
