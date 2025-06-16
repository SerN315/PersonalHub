import React from "react";
import { SettingsFormData } from "@/app/types/settings";

interface GeneralSettingsProps {
  data: SettingsFormData;
  onChange: (key: keyof SettingsFormData, value: any) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ data, onChange }) => {
  return (
    <div className="settings-section">
      <h3>General Settings</h3>
      {/* Add your general settings fields here */}
      <div>
        <label>Language</label>
        <select
          value={data.language}
          onChange={(e) => onChange("language", e.target.value)}
        >
          <option value="en">English</option>
          <option value="vi">Vietnamese</option>
          {/* Add more languages as needed */}
        </select>
      </div>
    </div>
  );
};

export default GeneralSettings;