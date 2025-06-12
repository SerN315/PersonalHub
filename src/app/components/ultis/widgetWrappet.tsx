import React, { useState, useEffect, useRef } from "react";
import { X, Minus } from "lucide-react";
import "@/app/styles/ultis/widgetWrapper.scss";
import { useEditMode } from "@/app/contexts/editWidgetContext";
import BasicIcon from "./icons";
import * as Icons from "@hugeicons/core-free-icons";


type WidgetWrapperProps = {
  title: string;
  onClose?: () => void;
  onMinimize?: () => void;
  children: React.ReactNode;
  minimized?: boolean;
};

export default function WidgetWrapper({
  title,
  onClose,
  onMinimize,
  children,
  minimized = false,
}: WidgetWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { editMode } = useEditMode();

  return (
    <div
      ref={wrapperRef}
      className={`widgetWrapper ${editMode ? "edit-mode" : ""}`}
    >
            <div className={`widgetWrapper__drag-handle ${editMode ? "show" : ""}`}>
        <div className={`widgetWrapper__controls ${editMode ? "show" : ""}`}>
          {onClose && editMode  && (
            <button
              onClick={(e) => {
                onClose();
              }}
              className="close-button"
            >
              <BasicIcon icon ="CancelCircleIcon" size={24} color="red" />
            </button>
          )}
        </div>
      </div>

      {!minimized && <div className="widgetWrapper__inner">{children}</div>}
    </div>
  );
}
