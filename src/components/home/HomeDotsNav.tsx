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
        "2xl:bottom-auto 2xl:left-auto 2xl:right-4 2xl:top-1/2 2xl:-translate-x-0 2xl:-translate-y-1/2",
      ].join(" ")}
    >
      <ul
        className={[
          "flex items-center gap-3 rounded-full bg-background/70 px-4 py-2 backdrop-blur",
          "2xl:flex-col 2xl:items-end 2xl:bg-transparent 2xl:px-0 2xl:py-0 2xl:backdrop-blur-0 2xl:mr-5",
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
                <span className="hidden 2xl:inline">{s.label}</span>

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
