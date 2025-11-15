// src/components/common/SmoothScroll.tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * SmoothScroll (versión segura)
 * -----------------------------------------------------------------------------
 * Objetivo:
 * - Aplicar desplazamiento vertical suave (easing) sobre el scroll de la página,
 *   sin romper:
 *   - Zoom del navegador (Ctrl + rueda, Ctrl + +/-).
 *   - Desplazamiento horizontal (Shift + rueda, trackpads).
 *   - Contenedores internos que tengan su propio scroll.
 *
 * Peras y manzanas:
 * - Si el usuario hace scroll normal vertical → se aplica “easing” suave.
 * - Si el usuario usa Ctrl/⌘/Alt/Shift → el navegador hace lo suyo (zoom, scroll
 *   horizontal, etc.), no intervenimos.
 * - Si el evento viene de un contenedor que sí puede seguir desplazándose
 *   (por ejemplo un div con overflow scroll) → no intervenimos.
 */
export default function SmoothScroll() {
  const rafId = useRef<number | null>(null);
  const currentY = useRef<number>(0);
  const targetY = useRef<number>(0);
  const enabled = useRef<boolean>(true);

  useEffect(() => {
    // Accesibilidad: respetar "prefers-reduced-motion"
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const cancelAnim = () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    const updateMotion = () => {
      enabled.current = !media.matches;
      cancelAnim();
    };

    updateMotion();
    media.addEventListener?.("change", updateMotion);

    // Inicializar posiciones
    currentY.current = window.scrollY;
    targetY.current = currentY.current;

    function animate() {
      const ease = 0.15; // coeficiente de relajación
      const diff = targetY.current - currentY.current;

      if (Math.abs(diff) < 0.5) {
        currentY.current = targetY.current;
        window.scrollTo(0, currentY.current);
        rafId.current = null;
        return;
      }

      currentY.current = currentY.current + diff * ease;
      window.scrollTo(0, currentY.current);
      rafId.current = requestAnimationFrame(animate);
    }

    const startAnim = () => {
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!enabled.current) return; // si usuario pidió menos movimiento, no intervenimos

      // 1) Dejar pasar cualquier combinación “especial”:
      //    - Ctrl / Meta / Alt → zoom o combinaciones del navegador.
      //    - Shift o deltaX dominante → scroll horizontal o gestos laterales.
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.shiftKey ||
        Math.abs(e.deltaX) > Math.abs(e.deltaY)
      ) {
        return; // no preventDefault, el navegador se encarga
      }

      const deltaY = e.deltaY;

      // 2) Si el evento viene de un contenedor que sí puede seguir desplazándose,
      //    dejamos que ese contenedor lo maneje.
      if (shouldLetElementScroll(e.target as HTMLElement | null, deltaY)) {
        return;
      }

      // 3) Interceptamos scroll vertical "del documento" y aplicamos smoothing
      e.preventDefault();

      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;

      targetY.current = targetY.current + deltaY;

      if (targetY.current < 0) targetY.current = 0;
      if (targetY.current > maxScroll) targetY.current = maxScroll;

      startAnim();
    };

    const onResize = () => {
      // Al cambiar el tamaño recalculamos límites y “anclamos” targetY
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;

      if (targetY.current > maxScroll) {
        targetY.current = maxScroll;
      }
      currentY.current = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      media.removeEventListener?.("change", updateMotion);
      window.removeEventListener("wheel", onWheel as EventListener);
      window.removeEventListener("resize", onResize);
      cancelAnim();
    };
  }, []);

  return null;
}

/**
 * Recorre el árbol de elementos desde el target hacia arriba y determina si
 * algún contenedor intermedio:
 * - Tiene overflow-y scroll/auto/visible, y
 * - Todavía puede seguir desplazándose en la dirección del delta.
 *
 * Si es así, devolvemos true → dejamos que el contenedor maneje el evento.
 */
function shouldLetElementScroll(
  target: HTMLElement | null,
  deltaY: number
): boolean {
  let el: HTMLElement | null = target;

  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;

    const canScrollY =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "visible") &&
      el.scrollHeight > el.clientHeight;

    if (canScrollY) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      // Si el contenedor puede seguir desplazándose en esta dirección, no interceptar
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
        return true;
      }
    }

    el = el.parentElement;
  }

  return false;
}
