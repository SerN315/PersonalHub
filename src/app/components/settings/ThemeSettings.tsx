// import React from "react";
// import { SettingsFormData } from "./settings";

// interface ThemeSettingsProps {
//   data: SettingsFormData;
//   onChange: (key: keyof SettingsFormData, value: any) => void;
// }

// const ThemeSettings: React.FC<ThemeSettingsProps> = ({ data, onChange }) => {
//   return (
//     <div className="settings-section">
//       <h3>Theme Settings</h3>
//       {/* Add your theme settings fields here */}
//       <div>
//         <label>Theme</label>
//         <select
//           value={data.theme || "light"}
//           onChange={(e) => onChange("theme", e.target.value)}
//         >
//           <option value="light">Light</option>
//           <option value="dark">Dark</option>
//           {/* Add more themes as needed */}
//         </select>
//       </div>
//     </div>
//   );
// };

// export default ThemeSettings;
