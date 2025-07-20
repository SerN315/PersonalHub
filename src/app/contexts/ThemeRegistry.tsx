// components/ThemeRegistry.tsx
"use client";

import { useEffect } from "react";
import { useThemeStore } from "../utils/store/ThemeStore";

interface ThemeRegistryProps {
  children: React.ReactNode;
}

export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get initial theme from localStorage or system
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialTheme = storedTheme || (systemPrefersDark ? "dark" : "light");

    setTheme(initialTheme);

    // Sync theme class to <html>
    const applyThemeClass = (newTheme: string) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(newTheme);
    };

    applyThemeClass(initialTheme); // Initial apply

    // Listen to system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn’t explicitly set theme in localStorage
      if (!storedTheme) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        applyThemeClass(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [setTheme]);

  // Always apply theme class if Zustand theme changes manually
  useEffect(() => {
    if (typeof window === "undefined") return;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
