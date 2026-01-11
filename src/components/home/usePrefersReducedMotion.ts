"use client";

/**
 * src/components/home/usePrefersReducedMotion.ts
 * =========================================================
 * PERAS Y MANZANAS
 * - Hook que detecta si el usuario pidió “reducir movimiento” en el SO.
 * - Si está activo, evitamos smooth scroll para respetar accesibilidad.
 * =========================================================
 */

import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);

    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}
