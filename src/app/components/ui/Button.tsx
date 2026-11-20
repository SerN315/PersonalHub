"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";
import { extend } from "./extend";

// THE button of the app: every button, whatever it looks like, is this component or one built on it (see extend.tsx). It follows the
// shadcn/ui Button: a `variant` (what kind) and a `size`, a variants table in one place, tokens instead of colours, and every native button
// attribute passes straight through.
//
//   <Button>Save</Button>                          the accent button
//   <Button variant="outline" size="sm">Cancel</Button>
//   <IconButton aria-label="Close"><Icon /></IconButton>
//
// To change how all buttons look, change this table. To add a look, add a variant.
//
// Some buttons are skeuomorphic parts of an object (a radio's keys, the desk's brass buttons). They keep their own look from their own
// stylesheet, and are still this component: they use a "skin" variant (below), which adds no styling of its own. `type` is "button" unless
// said otherwise, so a button never submits a form by accident.

// what every button on the accent/tone scale shares
const themed =
  "inline-flex items-center justify-center gap-2 font-bold cursor-pointer select-none whitespace-nowrap transition-[transform,filter,background-color,box-shadow,color] duration-150 disabled:cursor-not-allowed disabled:opacity-50";
const lift =
  "enabled:hover:-translate-y-px enabled:hover:brightness-105 enabled:hover:shadow-[0_6px_14px_-6px_rgb(var(--shadow-color)/0.4)] enabled:active:translate-y-0 enabled:active:brightness-95";

export const buttonVariants = cva("", {
  variants: {
    variant: {
      // ---- the scale ----
      default: `${themed} ${lift} border border-transparent bg-accent text-accent-ink`,
      secondary: `${themed} ${lift} border border-accent-line bg-accent-soft text-ink`,
      outline: `${themed} border border-line bg-transparent text-ink enabled:hover:bg-surface-2`,
      ghost: `${themed} border border-transparent bg-transparent text-ink-soft enabled:hover:bg-surface-2 enabled:hover:text-ink`,
      destructive: `${themed} border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-transparent text-danger enabled:hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]`,
      link: `${themed} border-0 bg-transparent p-0 text-accent underline underline-offset-4 enabled:hover:brightness-110`,
      // ---- skins: the look comes from the object's own stylesheet ----
      bare: "",
      mini: "miniBtn",
      chip: "chip",
      desk: "desk__btn",
    },
    size: {
      default: "min-h-10 rounded-ctl px-[18px]",
      sm: "min-h-8 rounded-ctl px-3 text-[13px]",
      lg: "min-h-12 rounded-ctl px-6 text-base",
      icon: "size-9 rounded-ctl p-0",
      none: "",
    },
    // a mood a skin can have
    tone: { neutral: "", go: "", danger: "", primary: "" },
  },
  compoundVariants: [
    { variant: "mini", tone: "go", class: "miniBtn--go" },
    { variant: "mini", tone: "danger", class: "miniBtn--danger" },
    { variant: "desk", tone: "primary", class: "is-primary" },
  ],
  defaultVariants: { variant: "default", tone: "neutral" },
});

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
const SKINS: ReadonlySet<Variant> = new Set(["bare", "mini", "chip", "desk"]);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  full?: boolean; // as wide as its container
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant, size, tone, full, className, type = "button", ...props }, ref) {
  const kind: Variant = variant ?? "default";
  // a skin has no size of its own: its stylesheet decides
  const chosenSize = size ?? (SKINS.has(kind) ? "none" : "default");
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant: kind, size: chosenSize, tone }), full && "w-full", className)} {...props} />;
});

// ---- built on Button ------------------------------------------------------------------------------------------------------------------------
// A button with only an icon has nothing to read out, so its name is required.
type IconButtonProps = Omit<ButtonProps, "variant" | "size" | "children" | "aria-label"> & { "aria-label": string; children: ReactNode };
export const IconButton = extend(Button, { variant: "ghost", size: "icon" }, "IconButton") as React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>>;
export const MiniButton = extend(Button, { variant: "mini" }, "MiniButton");
export const Chip = extend(Button, { variant: "chip" }, "Chip");
export const DeskButton = extend(Button, { variant: "desk" }, "DeskButton");

export default Button;
