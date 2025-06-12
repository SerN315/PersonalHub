import React, { FC, InputHTMLAttributes } from "react";
import "@/app/styles/ui/BaseInput.scss";
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input
        className={`input-field ${error ? "input-error" : ""}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
