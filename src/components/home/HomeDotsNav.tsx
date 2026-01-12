"use client";

/**
 * src/components/home/HomeDotsNav.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Navegación lateral para “diapositivas”:
 *   - A la derecha, centrada verticalmente.
 *   - Botones clickeables que saltan a cada sección.
 * - Mantiene tu ajuste en el <ul>:
 *   className="flex flex-col gap-3 items-end md:mr-5"
 * =========================================================
 */

import type { SectionDef } from "@/components/home/homeSections";

interface HomeDotsNavProps {
  sections: SectionDef[];
  activeId: string;
  onNavigate: (id: string) => void;
}

export default function HomeDotsNav({
  sections,
  activeId,
  onNavigate,
}: HomeDotsNavProps) {
  return (
    <nav
      aria-label="Navegación por secciones"
      className={[
        "fixed bottom-4 left-1/2 z-40 -translate-x-1/2",
        "md:bottom-auto md:left-auto md:right-4 md:top-1/2 md:-translate-x-0 md:-translate-y-1/2",
      ].join(" ")}
    >
      <ul
        className={[
          "flex items-center gap-3 rounded-full bg-background/70 px-4 py-2 backdrop-blur",
          "md:flex-col md:items-end md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0 md:mr-5",
        ].join(" ")}
      >
        {sections.map((s) => {
          const isActive = s.id === activeId;

          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onNavigate(s.id)}
                className={[
                  "group inline-flex items-center gap-2 rounded-md px-2 py-1",
                  "text-xs transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span className="hidden md:inline">{s.label}</span>

                <span
                  aria-hidden="true"
                  className={[
                    "h-2.5 w-2.5 rounded-full border transition-colors",
                    isActive
                      ? "border-foreground bg-foreground"
                      : "border-border bg-transparent",
                  ].join(" ")}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
