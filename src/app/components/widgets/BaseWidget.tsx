import React from "react";
import WidgetWrapper from "@/app/components/ultis/WidgetWrapper";
import WidgetProps from "@/app/types/widget";

type BaseWidgetProps = Pick<WidgetProps, "id" | "minimized" | "tint" | "onClose" | "onTint"> & {
  title: string;
  // Widgets that paint their own scene (the weather window) opt out of the tint colours.
  tintable?: boolean;
  children: React.ReactNode;
};

const BaseWidget: React.FC<BaseWidgetProps> = ({ children, ...rest }) => <WidgetWrapper {...rest}>{children}</WidgetWrapper>;

export default BaseWidget;
