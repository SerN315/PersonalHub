import React, { FC, InputHTMLAttributes } from "react";
import "@/app/styles/ui/BaseInput.scss";
import { useThemeStore } from "@/app/utils/store/ThemeStore";
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: FC<InputProps> = ({ label, error, ...props }) => {
  const theme = useThemeStore((state) => state.theme); // Get current theme
  return (
    <div className={`input-wrapper`}>
      <input
        className={`input-field ${error ? "input-error" : ""} ${
          theme === "dark" ? "input-dark" : "input-light"
        }`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
