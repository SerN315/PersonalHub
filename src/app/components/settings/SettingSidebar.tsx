import React from "react";
import { SettingsSidebarProps } from "@/app/types/settings";
import { SettingsTab } from "@/app/types/settings";


const tabs = [
  { key: "Profile", label: "Profile" },
  { key: "Account", label: "Account" },
  { key: "General", label: "General" },
  { key: "Theme", label: "Theme" },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onSelect }) => {
  return (
    <div className="settings-sidebar">
      <ul>
        {tabs.map((tab) => (
          <li
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            onClick={() => onSelect(tab.key as SettingsTab)}
          >
            {tab.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SettingsSidebar;