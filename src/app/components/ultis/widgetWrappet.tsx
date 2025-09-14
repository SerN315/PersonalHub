import React, { useRef } from "react";
import "@/app/styles/ultis/widgetWrapper.scss";
import { useEditMode } from "@/app/contexts/editWidgetContext";
import BasicIcon from "./icons";

type WidgetWrapperProps = {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
};

export default function WidgetWrapper({
  onClose,
  children,
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
          {onClose && editMode && (
            <button
              onClick={() => {
                onClose();
              }}
              className="close-button"
            >
              <BasicIcon icon="CancelCircleIcon" size={24} color="red" />
            </button>
          )}
        </div>
      </div>

      <div className="widgetWrapper__inner">{children}</div>
    </div>
  );
}
