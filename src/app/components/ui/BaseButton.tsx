import React from "react";
import "@/app/styles/ui/controls.scss";

type BaseButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: "primary" | "soft" | "ghost" | "danger";
  size?: "md" | "sm";
  full?: boolean;
  className?: string;
};

const BaseButton: React.FC<BaseButtonProps> = ({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  type = "button",
  children,
  ...rest
}) => {
  const classes = ["btn", variant !== "primary" && `btn--${variant}`, size === "sm" && "btn--sm", full && "btn--full", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
};

export default BaseButton;
