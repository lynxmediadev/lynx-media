"use client";

/**
 * src/components/site/ThemeToggle.tsx
 * =========================================================
 * PERAS Y MANZANAS (qué hace este archivo)
 * - Implementa un toggle simple de tema SIN librerías:
 *   - Modo oscuro = default (sin clase especial).
 *   - Modo claro = <html class="light">.
 * - Persiste la preferencia en localStorage.
 * - No toca rutas ni estados globales complejos.
 * =========================================================
 */

import { useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "lm-theme"; // "dark" | "light"

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Default: dark (coherente con tu identidad y con :root actual)
  return "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);

    const root = document.documentElement;
    if (initial === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, []);

  const label = useMemo(
    () => (theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"),
    [theme]
  );

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);

    const root = document.documentElement;
    if (next === "light") root.classList.add("light");
    else root.classList.remove("light");

    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
