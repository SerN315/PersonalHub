"use client";
import React from "react";
import "@/app/styles/ultis/widgetWrapper.scss";
import { useEditMode } from "@/app/contexts/editWidgetContext";
import BasicIcon from "./icons";
import { TINTS, Tint } from "@/app/utils/preferences";

type WidgetWrapperProps = {
  id: string;
  title: string;
  tint?: Tint;
  tintable?: boolean;
  onClose?: (id: string) => void;
  onTint?: (id: string, tint: Tint) => void;
  children: React.ReactNode;
  minimized?: boolean;
};

// The one card every widget lives in: same surface, border, corners and shadow, tinted per widget.
// In arrange mode a small toolbar appears to recolour or remove it.
export default function WidgetWrapper({ id, title, tint = "paper", tintable = true, onClose, onTint, children, minimized = false }: WidgetWrapperProps) {
  const { editMode } = useEditMode();

  return (
    <div className={`widgetCard ${editMode ? "is-editing" : ""}`} data-tint={tint} aria-label={title} role="group">
      {editMode && (
        <div className="widgetCard__toolbar" onMouseDown={(event) => event.stopPropagation()}>
          {tintable && onTint && (
            <div className="widgetCard__tints" role="radiogroup" aria-label={`${title} colour`}>
              {TINTS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={tint === option}
                  aria-label={option}
                  title={option}
                  className="widgetCard__tint"
                  data-tint={option}
                  onClick={() => onTint(id, option)}
                />
              ))}
            </div>
          )}
          {onClose && (
            <button type="button" className="widgetCard__remove" onClick={() => onClose(id)} aria-label={`Remove ${title}`} title="Remove">
              <BasicIcon icon="Delete02Icon" size={16} />
            </button>
          )}
        </div>
      )}
      {!minimized && <div className="widgetCard__inner">{children}</div>}
    </div>
  );
}
