"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
  onClick={toggleTheme}
  className="theme-toggle fixed top-4 right-4 px-4 py-2 rounded-md"
>
  Switch theme
</button>


  );
}
