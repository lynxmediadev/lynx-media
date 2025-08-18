// src/components/common/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored as Theme;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function ThemeToggle() {
  // Estado inicial neutro; se sincroniza en cliente
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getPreferredTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle fixed top-4 right-4 px-4 py-2 rounded-md border select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current"
      aria-pressed={isDark}
      aria-label={label}
      title={label}
    >
      <span className="inline-flex items-center gap-2">
        {isDark ? (
          // Sol → pasar a claro
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            role="img"
            fill="currentColor"
          >
            <path d="M6.76 4.84 4.97 3.05 3.55 4.47l1.79 1.79 1.42-1.42zM1 13h3v-2H1v2zm10-9h2V1h-2v3zm7.07 1.21 1.79-1.79-1.42-1.42-1.79 1.79 1.42 1.42zM17 13h3v-2h-3v2zM11 23h2v-3h-2v3zM4.22 19.78l1.79-1.79-1.42-1.42-1.79 1.79 1.42 1.42zM18.36 19.78l1.79-1.79-1.42-1.42-1.79 1.79 1.42 1.42zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
          </svg>
        ) : (
          // Luna → pasar a oscuro
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            role="img"
            fill="currentColor"
          >
            <path d="M21.64 13a9 9 0 0 1-11.3-11.3A9 9 0 1 0 21.64 13z" />
          </svg>
        )}
        <span className="sr-only">{label}</span>
        <span aria-hidden="true">{isDark ? "Light" : "Dark"}</span>
      </span>
    </button>
  );
}
