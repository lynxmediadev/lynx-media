/**
 * src/components/home/homeSections.ts
 * =========================================================
 * PERAS Y MANZANAS
 * - Define la “tabla de contenido” del Homepage:
 *   IDs (anchors) + labels (UI).
 * - Se usa para:
 *   - dots nav
 *   - observer de sección activa
 *   - consistencia de naming
 * =========================================================
 */

export type SectionDef = { id: string; label: string };

export const SECTIONS: SectionDef[] = [
  { id: "hero", label: "Inicio" },
  { id: "services", label: "Servicios" },
  { id: "catalog", label: "Catálogo" },
  { id: "portfolio", label: "Portafolio" },
  { id: "contact", label: "Contacto" },
];
