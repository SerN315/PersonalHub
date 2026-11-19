"use client";
import { forwardRef, useId, type LabelHTMLAttributes } from "react";
import { cn } from "./cn";
import { Input, type InputProps } from "./Input";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(function Label({ className, ...props }, ref) {
  return <label ref={ref} className={cn("text-[13px] font-bold text-ink", className)} {...props} />;
});

interface FieldProps extends InputProps {
  label?: string;
  hint?: string;
  error?: string;
}

// A labelled field: a real <label> joined to its input, with a hint or an error that screen readers announce along with it (the shadcn/ui
// "form field" pattern, in one component).
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, hint, error, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="field flex flex-col gap-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <Input ref={ref} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {error ? (
        <span id={`${inputId}-error`} className="text-[12px] font-semibold text-danger" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-[12px] text-ink-soft">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
