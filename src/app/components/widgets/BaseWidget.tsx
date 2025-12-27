import React from "react";
import WidgetWrapper from "@/app/components/ultis/widgetWrappet";
interface BaseWidgetProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const BaseWidget: React.FC<BaseWidgetProps> = ({
  title,
  children,
  onClose,
}) => {
  return (
    <WidgetWrapper title={title} onClose={onClose}>
      {children}
    </WidgetWrapper>
  );
};

export default BaseWidget;
