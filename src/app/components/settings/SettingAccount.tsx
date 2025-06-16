import React from "react";
import { SettingAccountProps } from "@/app/types/settings";



const SettingAccount: React.FC<SettingAccountProps> = ({ data, onChange }) => {
  return (
    <div className="settings-section">
      <h3>Account Settings</h3>
      {/* Add your account settings fields here */}
      <div>
        <label>Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>
      {/* Add more account fields as needed */}
    </div>
  );
};

export default SettingAccount;