"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ICONS, type IconName } from "./iconSet";

export type { IconName };

interface IconProps {
  icon: IconName;
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
  return (
    <HugeiconsIcon
      icon={ICONS[icon]}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
