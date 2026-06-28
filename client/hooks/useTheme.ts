"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pm-theme";

export function useTheme() {
  // Default to dark; corrected on first client render via useEffect
  const [isDark, setIsDark] = useState(true);

  // On mount: read persisted preference and sync the <html> class
  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    const dark = saved !== "light";
    setIsDark(dark);
    document.documentElement.classList.toggle("light", !dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return { isDark, toggle };
}
