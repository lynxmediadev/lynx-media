"use client";

/**
 * src/components/home/ContactSection.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Sección 5 (Contacto).
 * - Placeholder por ahora, 1 pantalla completa, sin scroll interno.
 * =========================================================
 */

interface ContactSectionProps {
  panelStyle: { height: string };
}

export default function ContactSection({ panelStyle }: ContactSectionProps) {
  return (
    <section
      id="contact"
      className="flex snap-start items-center justify-center"
      style={panelStyle}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold md:text-5xl">
          Contacto
        </h2>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Placeholder (1 pantalla). Formulario o CTA de contacto.
        </p>
      </div>
    </section>
  );
}
