// src/components/common/SmoothScroll.tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * SmoothScroll
 * ------------
 * - Aplica easing al scroll vertical del documento.
 * - Respeta:
 *   - prefers-reduced-motion
 *   - Zoom del navegador (Ctrl/⌘ + wheel)
 *   - Gestos horizontales (deltaX dominante, Shift)
 *   - Contenedores internos con overflowY scroll/auto
 * - Evita “saltos” sincronizando siempre con window.scrollY
 *   cuando el navegador scrollea por su cuenta (barra, teclado, anchors).
 */
export default function SmoothScroll() {
  const rafId = useRef<number | null>(null);
  const currentY = useRef(0);
  const targetY = useRef(0);
  const enabled = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const cancelAnim = () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    const syncFromWindow = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      currentY.current = y;
      targetY.current = y;
    };

    const updateMotion = () => {
      enabled.current = !media.matches;
      cancelAnim();
      syncFromWindow();
    };

    updateMotion();
    media.addEventListener?.("change", updateMotion);

    const animate = () => {
      if (rafId.current == null) return;

      const diff = targetY.current - currentY.current;

      // Si estamos suficientemente cerca, fijamos y paramos.
      if (Math.abs(diff) < 0.5) {
        currentY.current = targetY.current;
        window.scrollTo(0, currentY.current);
        rafId.current = null;
        return;
      }

      const ease = 0.12; // factor de suavizado
      currentY.current += diff * ease;
      window.scrollTo(0, currentY.current);
      rafId.current = window.requestAnimationFrame(animate);
    };

    const startAnim = () => {
      if (rafId.current == null) {
        rafId.current = window.requestAnimationFrame(animate);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!enabled.current) return;

      // 1) Dejar pasar combinaciones especiales (zoom, horizontal, etc.)
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.shiftKey ||
        Math.abs(e.deltaX) > Math.abs(e.deltaY)
      ) {
        return;
      }

      const deltaY = e.deltaY;
      if (deltaY === 0) return;

      // 2) Si un contenedor interno puede seguir scrolleando, no intervenimos
      if (shouldLetElementScroll(e.target as HTMLElement | null, deltaY)) {
        cancelAnim();
        syncFromWindow();
        return;
      }

      // 3) Interceptamos el scroll del documento
      e.preventDefault();

      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;

      // Antes de empezar, sincronizamos con la posición real actual
      if (rafId.current == null) {
        syncFromWindow();
      }

      targetY.current += deltaY;
      if (targetY.current < 0) targetY.current = 0;
      if (targetY.current > maxScroll) targetY.current = maxScroll;

      startAnim();
    };

    const onScroll = () => {
      // Si el navegador scrollea por su cuenta (teclado, barra, anchor)
      // y no hay animación en curso, actualizamos referencias internas.
      if (rafId.current == null) {
        syncFromWindow();
      }
    };

    const onResize = () => {
      syncFromWindow();
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      if (targetY.current > maxScroll) {
        targetY.current = maxScroll;
        window.scrollTo(0, targetY.current);
      }
    };

    // Inicial
    syncFromWindow();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnim();
      media.removeEventListener?.("change", updateMotion);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}

/**
 * Determina si debemos dejar que un contenedor interno maneje el scroll.
 * Recorre la cadena de padres buscando elementos con overflowY scroll/auto
 * que aún puedan seguir desplazándose en la dirección deltaY.
 */
function shouldLetElementScroll(
  target: HTMLElement | null,
  deltaY: number
): boolean {
  let el = target;

  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;

    const isScrollableContainer =
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight;

    if (isScrollableContainer) {
      const atTop = el.scrollTop <= 0;
      const atBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      // Si ese contenedor todavía puede scrollear en la dirección de deltaY,
      // no interceptamos.
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
        return true;
      }
    }

    el = el.parentElement;
  }

  return false;
}
