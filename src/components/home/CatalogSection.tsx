"use client";

/**
 * src/components/home/CatalogSection.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Sección 3 (Catálogo).
 * - Placeholder por ahora, 1 pantalla completa, sin scroll interno.
 * =========================================================
 */

interface CatalogSectionProps {
  panelStyle: { height: string };
}

export default function CatalogSection({ panelStyle }: CatalogSectionProps) {
  return (
    <section
      id="catalog"
      className="flex snap-start items-center justify-center"
      style={panelStyle}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold md:text-5xl">
          Catálogo musical
        </h2>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Placeholder (1 pantalla). Enlazará a /catalog.
        </p>
      </div>
    </section>
  );
}
