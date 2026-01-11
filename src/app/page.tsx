/**
 * src/app/page.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Este archivo es la “entrada” del Homepage (/).
 * - Mantiene page.tsx mínimo: delega todo el comportamiento de Snap
 *   y la composición de secciones a un componente dedicado (HomeSnap).
 * =========================================================
 */

import HomeSnap from "@/components/home/HomeSnap";

export default function HomePage() {
  return <HomeSnap />;
}
