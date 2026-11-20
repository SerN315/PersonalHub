"use client";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

// THE form field of the app: every text field, number field, text area and drop-down is one of these. Like the shadcn/ui Input, it is a
// native element with one shared look, and every native attribute (value, onChange, ref, aria-*) passes straight through.
//
//   <Input placeholder="Search" />                 the standard field
//   <Input variant="compact" />                    a smaller one for tight places
//   <Input variant="bare" />                       no look of its own: it sits inside something that has one (a search box, a title)
//
// To change how all fields look, change this table.

const field =
  "w-full border border-line bg-surface text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-soft/70 enabled:hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_25%,transparent)] aria-[invalid=true]:border-danger disabled:opacity-60";

export const fieldVariants = cva("", {
  variants: {
    variant: {
      default: `${field} min-h-11 rounded-ctl px-3.5 py-2.5`,
      compact: `${field} min-h-8 rounded-lg px-2.5 py-1 text-[13px]`,
      bare: "",
    },
  },
  defaultVariants: { variant: "default" },
});

type FieldVariants = VariantProps<typeof fieldVariants>;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, FieldVariants {}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ variant, className, type = "text", ...props }, ref) {
  return <input ref={ref} type={type} className={cn(fieldVariants({ variant }), className)} {...props} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldVariants {}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ variant, className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldVariants({ variant }), variant !== "bare" && "min-h-22 resize-y", className)} {...props} />;
});

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">, FieldVariants {}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ variant, className, ...props }, ref) {
  return <select ref={ref} className={cn(fieldVariants({ variant }), className)} {...props} />;
});

// A tick box. It takes the accent colour, and nothing else about it is changed from the browser's own, which is the most accessible one.
export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">>(function Checkbox({ className, ...props }, ref) {
  return <input ref={ref} type="checkbox" className={cn("accent-accent", className)} {...props} />;
});
