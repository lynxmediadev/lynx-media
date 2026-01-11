"use client";

/**
 * src/components/home/ServicesSection.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Sección 2 (Servicios).
 * - Placeholder por ahora, 1 pantalla completa, sin scroll interno.
 * =========================================================
 */

interface ServicesSectionProps {
  panelStyle: { height: string };
}

export default function ServicesSection({ panelStyle }: ServicesSectionProps) {
  return (
    <section
      id="services"
      className="flex snap-start items-center justify-center"
      style={panelStyle}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold md:text-5xl">
          Servicios
        </h2>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Placeholder (1 pantalla). Aquí definiremos el listado final.
        </p>
      </div>
    </section>
  );
}
