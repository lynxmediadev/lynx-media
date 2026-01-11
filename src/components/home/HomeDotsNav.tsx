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
      className="fixed right-4 top-1/2 z-40 -translate-y-1/2"
    >
      <ul className="flex flex-col gap-3 items-end md:mr-5">
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
                <span className="hidden sm:inline">{s.label}</span>

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
