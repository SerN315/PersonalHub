"use client";

import React, { useRef } from "react";
import "@/app/styles/ui/controls.scss";

interface Option<T extends string> {
  value: T;
  label: string;
  // Swatches only: any CSS colour (or a var()).
  color?: string;
  icon?: React.ReactNode;
}

interface GroupProps<T extends string> {
  label: string; // announced by screen readers
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
}

// Radiogroup keyboard behaviour shared by Segmented and Swatches: arrows move the choice, only the chosen item is tabbable.
function useRadioKeys<T extends string>({ value, options, onChange }: Omit<GroupProps<T>, "label">) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const current = options.findIndex((o) => o.value === value);
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

export function Segmented<T extends string>(props: GroupProps<T>) {
  const { label, value, options, onChange } = props;
  const { refs, onKeyDown } = useRadioKeys(props);
  return (
    <div className="segmented" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          className="segmented__item"
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Swatches<T extends string>(props: GroupProps<T>) {
  const { label, value, options, onChange } = props;
  const { refs, onKeyDown } = useRadioKeys(props);
  return (
    <div className="swatches" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          aria-label={option.label}
          title={option.label}
          tabIndex={value === option.value ? 0 : -1}
          className="swatches__item"
          style={{ ["--swatch" as string]: option.color }}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}
