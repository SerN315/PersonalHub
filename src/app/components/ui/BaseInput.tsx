import React, { InputHTMLAttributes, useId } from "react";
import "@/app/styles/ui/controls.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

// A labelled text field. The label is a real <label>, and hint/error are announced with the input.
const Input: React.FC<InputProps> = ({ label, hint, error, id, className = "", ...props }) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
};

export default Input;
