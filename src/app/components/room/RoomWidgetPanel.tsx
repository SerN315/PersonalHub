"use client";
import { memo, useEffect } from "react";
import BasicIcon from "../ultis/icons";
import { useEscape } from "../widgets/radio/useEscape";
import { useRoomWidget } from "./useRoomWidget";
import { getWidgetDefinition } from "@/app/widgets/registry";

interface Props {
  type: string; // the widget type this object stands for
  create?: boolean; // make the widget on first use if you do not have it yet
  onClose: () => void;
}

// A real widget, opened over the room for a quick use, then put away. Click outside it or press Escape to close.
function RoomWidgetPanel({ type, create, onClose }: Props) {
  const widget = useRoomWidget(type, { create });
  const definition = getWidgetDefinition(type);
  useEscape(onClose);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, []);

  if (!definition) return null;
  const Component = definition.component;
  return (
    <div className="roomPanel" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`roomPanel__window roomPanel__window--${type}`} role="dialog" aria-label={definition.name}>
        <button type="button" className="roomPanel__close" onClick={onClose} aria-label={`Close ${definition.name}`}>
          <BasicIcon icon="Cancel01Icon" size={18} />
        </button>
        {widget.ready && <Component id={widget.id} data={widget.data} onData={widget.onData} tint={definition.tint} />}
      </div>
    </div>
  );
}

export default memo(RoomWidgetPanel);
