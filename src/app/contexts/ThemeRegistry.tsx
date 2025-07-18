// components/ThemeRegistry.tsx
"use client"; // This directive makes this component a Client Component

import { useEffect } from "react";
import { useThemeStore } from "../utils/store/ThemeStore";

interface ThemeRegistryProps {
  children: React.ReactNode;
}

export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get initial theme if not already set in the store (e.g., first client-side load)
      // This ensures the Zustand store has the correct initial state.
      if (!theme || (theme !== "dark" && theme !== "light")) {
        // Added check for invalid theme
        const initialTheme =
          localStorage.getItem("theme") ||
          (window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light");
        setTheme(initialTheme); // Update the Zustand store
      }

      // Always ensure the correct class is on the documentElement
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(theme);
    }
  }, [theme, setTheme]); // Re-run if theme or setTheme changes

  return <>{children}</>; // Render children as is, the theme logic applies to document.documentElement
}
