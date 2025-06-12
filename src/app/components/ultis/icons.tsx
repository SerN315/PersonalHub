"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import * as Icons from "@hugeicons/core-free-icons";

interface IconProps {
  icon: keyof typeof Icons;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export default function BasicIcon({
  icon,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.5,
  className = "",
}: IconProps) {
  const IconComponent = Icons[icon];

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in HugeIcons`);
    return null;
  }

  return (
    <HugeiconsIcon
      icon={IconComponent}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
