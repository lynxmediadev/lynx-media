"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

export default function ThemeChanger() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 px-4 py-2 rounded 
                 bg-[--color-background] text-[--color-text]
                 border border-[--color-text]
                 transition-colors duration-300"
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
