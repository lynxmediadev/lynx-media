"use client";

/**
 * src/components/home/PortfolioSection.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Sección 4 (Portafolio).
 * - Placeholder por ahora, 1 pantalla completa, sin scroll interno.
 * =========================================================
 */

interface PortfolioSectionProps {
  panelStyle: { height: string };
}

export default function PortfolioSection({ panelStyle }: PortfolioSectionProps) {
  return (
    <section
      id="portfolio"
      className="flex snap-start items-center justify-center"
      style={panelStyle}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold md:text-5xl">
          Portafolio
        </h2>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Placeholder (1 pantalla). Proyectos / Case Studies.
        </p>
      </div>
    </section>
  );
}
