"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "lva-houses-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey) as Theme | null;
      const nextTheme = saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      applyTheme(nextTheme);
      setTheme(nextTheme);
    } catch {
      applyTheme("light");
    }
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    try { window.localStorage.setItem(storageKey, nextTheme); } catch { /* Private browsing can block persistence. */ }
  }

  const isDark = theme === "dark";
  return <button type="button" className="theme-toggle" onClick={toggleTheme} aria-pressed={isDark} aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} title={isDark ? "Switch to light theme" : "Switch to dark theme"}>
    {isDark ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z" /></svg>}
    <span>{isDark ? "Light" : "Dark"}</span>
  </button>;
}
