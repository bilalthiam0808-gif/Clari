"use client";

import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

export function useTheme(defaultTheme: Theme, storageKey: string) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initial = stored ?? defaultTheme;
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    setTheme(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }

  return { theme, toggle };
}
