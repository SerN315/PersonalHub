import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Joins class names and settles clashes between Tailwind classes (the last one wins), as in shadcn/ui. Class names that are not Tailwind
// (the app's own stylesheet classes) pass through untouched.
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
