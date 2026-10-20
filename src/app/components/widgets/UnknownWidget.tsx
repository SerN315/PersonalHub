"use client";
import React, { memo } from "react";
import BaseWidget from "./BaseWidget";
import BasicIcon from "../ultis/icons";
import type WidgetProps from "@/app/types/widget";

// Shown for a widget type this version of the app does not know (for example after going back to an older version).
// It can still be removed in Arrange mode, so nothing is ever stuck on the board.
function UnknownWidget(props: WidgetProps) {
  return (
    <BaseWidget title="Unavailable widget" {...props} tintable={false}>
      <div className="widgetUnknown">
        <BasicIcon icon="CloudIcon" size={28} strokeWidth={1.3} />
        <p>This widget isn&apos;t available in this version.</p>
        <small>Use Arrange to remove it.</small>
      </div>
    </BaseWidget>
  );
}

export default memo(UnknownWidget);
