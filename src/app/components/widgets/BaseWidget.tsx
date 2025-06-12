import React from "react";
import WidgetWrapper from "@/app/components/ultis/widgetWrappet";
interface BaseWidgetProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  minimized?: boolean;
}

const BaseWidget: React.FC<BaseWidgetProps> = ({
  title,
  children,
  onClose,
  onMinimize,
  minimized,
}) => {
  return (
    <WidgetWrapper
      title={title}
      onClose={onClose}
      onMinimize={onMinimize}
      minimized={minimized}
    >
      {children}
    </WidgetWrapper>
  );
};

export default BaseWidget;