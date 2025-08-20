"use client";

import { useEffect, useRef } from "react";

/**
 * SmoothScroll
 * - Intercepta la rueda del mouse/trackpad y aplica easing con requestAnimationFrame.
 * - Respeta prefers-reduced-motion.
 * - Evita interferir si el objetivo del evento está dentro de un contenedor scrollable.
 */
export default function SmoothScroll() {
  const rafId = useRef<number | null>(null);
  const currentY = useRef<number>(0);
  const targetY = useRef<number>(0);
  const enabled = useRef<boolean>(true);

  useEffect(() => {
    // Accesibilidad: si el usuario prefiere menos movimiento, deshabilitar
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      enabled.current = !media.matches;
      cancelAnim();
    };
    updateMotion();
    media.addEventListener?.("change", updateMotion);

    // Inicializar posiciones
    currentY.current = window.scrollY;
    targetY.current = currentY.current;

    const onWheel = (e: WheelEvent) => {
      if (!enabled.current) return; // respetar accesibilidad

      // Si el target está dentro de un contenedor scrollable que puede seguir desplazándose, no interceptar
      if (hasScrollableAncestor(e.target as HTMLElement, e.deltaY)) return;

      // Interceptamos para aplicar easing propio
      e.preventDefault();

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      // Acumular destino con deltaY
      targetY.current = clamp(targetY.current + e.deltaY, 0, maxScroll);

      // Lanzar animación si no hay una corriendo
      if (rafId.current === null) animate();
    };

    // Necesitamos passive:false para poder preventDefault
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel as EventListener);
      media.removeEventListener?.("change", updateMotion);
      cancelAnim();
    };
  }, []);

  function animate() {
    // Easing tipo “critically-damped”: lerp suave
    const ease = 0.05; // ajustar sensibilidad (0.08–0.18)
    const tick = () => {
      const y = currentY.current + (targetY.current - currentY.current) * ease;
      currentY.current = y;
      window.scrollTo(0, y);

      if (Math.abs(targetY.current - currentY.current) < 0.5) {
        // Snap final para no quedar con decimales residuales
        window.scrollTo(0, targetY.current);
        cancelAnim();
        return;
      }
      rafId.current = window.requestAnimationFrame(tick);
    };
    rafId.current = window.requestAnimationFrame(tick);
  }

  function cancelAnim() {
    if (rafId.current !== null) {
      window.cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }

  return null;
}

/** Utilidades */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

/**
 * Determina si el evento ocurrió dentro de un contenedor que:
 *  - es desplazable (overflow auto/scroll) y
 *  - todavía puede desplazar en la dirección del delta.
 */
function hasScrollableAncestor(node: HTMLElement | null, deltaY: number): boolean {
  let el: HTMLElement | null = node;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = getComputedStyle(el);
    const canScrollY =
      /(auto|scroll)/.test(style.overflowY) ||
      (style.overflowY === "visible" && el.scrollHeight > el.clientHeight);

    if (canScrollY) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      // Si puede seguir desplazando en la dirección de delta, no interceptar
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}
