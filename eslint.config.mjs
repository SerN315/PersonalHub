import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Buttons and form fields come from the component kit (src/app/components/ui), so one place decides how they look and behave.
// A raw <button>, <input>, <select> or <textarea> is an error everywhere except in the kit itself. (The Planner, which is finished, is
// left as it was.)
const useTheKit = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/app/components/ui/**", "src/app/components/todo/**"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]",
        message: 'Use the kit instead: import { Button, Input, Select, Textarea, Checkbox } from "@/app/components/ui".',
      },
    ],
  },
};

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, useTheKit];

export default eslintConfig;
