"use client";

/**
 * src/components/home/HeroSection.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Sección 1 (Hero).
 * - Snap: snap-start + altura de 1 pantalla visible.
 * - Incluye el “hint” (Servicios + flecha) solo en este panel.
 * - El hint se oculta cuando el usuario empieza a scrollear.
 * =========================================================
 */

import { ChevronDown } from "lucide-react";

interface HeroSectionProps {
  panelStyle: { height: string };
  hideHint: boolean;
  onHintClick: () => void;
}

export default function HeroSection({
  panelStyle,
  hideHint,
  onHintClick,
}: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative flex snap-start items-center justify-center"
      style={panelStyle}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="text-balance text-3xl font-semibold md:text-5xl">
          Creamos identidad sonora para tus proyectos audiovisuales.
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Precisión técnica, criterio estético y entrega profesional.
        </p>
      </div>

      <button
        type="button"
        onClick={onHintClick}
        className={[
          "group absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 text-sm",
          "text-muted-foreground transition-all duration-200 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          hideHint ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100",
        ].join(" ")}
        aria-label="Bajar a la sección Servicios"
      >
        <span>Servicios</span>
        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
      </button>
    </section>
  );
}
