/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/audio/Sparkline.tsx                                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Recibe un waveform guardado en DB como Bytes (Float32) codificados base64.│
 * │ - Decodifica base64 → Float32Array y dibuja un sparkline (SVG) **igual** en │
 * │   SSR y cliente, evitando hydration mismatch.                               │
 * │ - Soporta interacción: línea vertical al hover + tooltip con índice, valor  │
 * │   [0..1] y tiempo (si mandas durationSec).                                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - **Isomórfico**: en navegador usamos `atob`, en SSR usamos `Buffer`.       │
 * │ - No usamos `typeof window` para decidir el render → server y cliente       │
 * │   calculan lo mismo y el HTML coincide.                                     │
 * │ - Interacción 100% en cliente: overlay absoluto con línea/tarjeta.          │
 * │ - Re-muestreamos a `targetPts` con *peak hold* por ventana para conservar   │
 * │   la “forma” del audio al reducir puntos.                                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import React, { useMemo, useRef, useState } from "react";

type Props = {
  /** Waveform como base64 de los Bytes (Float32) que vienen desde Prisma. */
  base64?: string | null;
  /** Alto del sparkline en píxeles (SVG). */
  height?: number;
  /** Ancho del sparkline (se estira al contenedor). */
  width?: number | string;
  /** Cantidad de puntos objetivo para render. */
  targetPts?: number;
  /** Clase opcional para Tailwind. */
  className?: string;
  /** Grosor de trazo del sparkline. */
  strokeWidth?: number;
  /** Duración en segundos (opcional) para mostrar tiempo en tooltip. */
  durationSec?: number | null;
  /** Color opcional del trazo (fallback: currentColor). */
  strokeColor?: string;
  /** Color opcional del fondo. */
  backgroundColor?: string;
  /** Color opcional de la línea media. */
  midlineColor?: string;
  /** Color opcional del texto vacío/tooltip. */
  textColor?: string;
};

/** Decodifica base64 → Uint8Array de forma isomórfica (browser + Node SSR). */
function bytesFromBase64(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const buf = (globalThis as any).Buffer
    ? (globalThis as any).Buffer.from(b64, "base64")
    : null;
  if (!buf) return new Uint8Array(0);
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/** Decodifica base64 a Float32Array (Bytes → Float32). */
function float32FromBase64(b64: string): Float32Array {
  if (!b64) return new Float32Array(0);
  const bytes = bytesFromBase64(b64);
  return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
}

/** Re-muestrea usando pico por ventana para mantener la forma general. */
function downsamplePeak(data: Float32Array, target: number): Float32Array {
  if (data.length === 0 || target <= 0) return new Float32Array(0);
  if (data.length === target) return data;
  const out = new Float32Array(target);
  const win = Math.floor(data.length / target) || 1;
  for (let i = 0; i < target; i++) {
    const start = i * win;
    const end = i + 1 === target ? data.length : (i + 1) * win;
    let peak = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(data[j] ?? 0);
      if (v > peak) peak = v;
    }
    // Los datos están normalizados 0..1
    out[i] = peak;
  }
  return out;
}

/** Formatea segundos a mm:ss.s (p. ej., 1:23.4). */
function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  const sStr = s < 10 ? `0${s.toFixed(1)}` : s.toFixed(1);
  return `${m}:${sStr}`;
}

export default function Sparkline({
  base64,
  height = 56,
  width = "100%",
  targetPts = 256,
  className = "",
  strokeWidth = 2,
  durationSec = null,
  strokeColor,
  backgroundColor,
  midlineColor,
  textColor,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // 1) Decodificar y remuestrear (igual en SSR y cliente)
  const values = useMemo(() => {
    try {
      if (!base64) return new Float32Array(0);
      const arr = float32FromBase64(base64);
      return downsamplePeak(arr, targetPts);
    } catch {
      return new Float32Array(0);
    }
  }, [base64, targetPts]);

  // 2) Construir puntos de la polilínea en coordenadas SVG
  const pointsAttr = useMemo(() => {
    if (values.length === 0) return "";
    const wUnits = typeof width === "number" ? width : 1000; // viewBox de 1000 unidades
    const h = height;
    const step = wUnits / (values.length - 1);
    const mid = h / 2;

    const pts: string[] = [];
    for (let i = 0; i < values.length; i++) {
      const x = i * step;
      const amp = Math.max(0, Math.min(1, values[i] ?? 0)); // clamp 0..1
      const y = mid - amp * (h / 2 - 1); // centrado vertical
      pts.push(`${x},${y}`);
    }
    return pts.join(" ");
  }, [values, height, width]);

  const empty = values.length === 0;

  // 3) Interacción (línea vertical + tooltip)
  const [hoverX, setHoverX] = useState<number | null>(null); // posición x en px relativa al contenedor
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  function onPointerMove(e: React.PointerEvent) {
    if (!wrapRef.current || empty) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    // índice aproximado según la posición
    const idx = Math.round((x / Math.max(1, rect.width)) * (values.length - 1));
    setHoverX(x);
    setHoverIdx(idx);
  }

  function onPointerLeave() {
    setHoverX(null);
    setHoverIdx(null);
  }

  const hoverVal = hoverIdx != null ? values[hoverIdx] : null;
  const hoverTime =
    hoverIdx != null && durationSec != null
      ? (hoverIdx / Math.max(1, values.length - 1)) * durationSec
      : null;

  const stroke = strokeColor ?? "currentColor";
  const bg = backgroundColor ?? "rgba(255,255,255,0.06)";
  const mid = midlineColor ?? "rgba(255,255,255,0.18)";
  const text = textColor ?? "rgba(255,255,255,0.75)";

  return (
    <div
      className={`relative w-full ${className}`}
      ref={wrapRef}
      style={{ color: stroke }}
    >
      <svg
        viewBox={`0 0 1000 ${height}`}
        width={width}
        height={height}
        aria-label="Sparkline del waveform"
        className="block cursor-crosshair"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <rect
          x="0"
          y="0"
          width="1000"
          height={height}
          rx="6"
          fill={bg}
        />
        {/* Línea base */}
        <line
          x1="0"
          y1={height / 2}
          x2="1000"
          y2={height / 2}
          stroke={mid}
          strokeWidth={1}
        />
        {/* Wave o fallback */}
        {empty ? (
          <text x="16" y={height / 2 + 4} fill={text} className="text-[12px]">
            Sin waveform
          </text>
        ) : (
          <polyline
            points={pointsAttr}
            className="fill-none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Overlay de interacción: línea vertical y tooltip. 
          Usamos HTML posicionado (no <foreignObject>) por simplicidad y compatibilidad. */}
      {!empty && hoverX != null && (
        <>
          {/* Línea vertical */}
          <div
            className="absolute top-0 bottom-0 w-px bg-indigo-600 pointer-events-none"
            style={{ left: `${hoverX}px` }}
          />
          {/* Tooltip */}
          <div
            className="absolute -translate-y-full px-2 py-1 rounded bg-black text-white text-[11px] pointer-events-none"
            style={{
              left: `${hoverX + 8}px`,
              top: 0,
              whiteSpace: "nowrap",
            }}
          >
            {hoverIdx != null ? (
              <>
                idx <strong>{hoverIdx}</strong> · val{" "}
                <strong>{hoverVal?.toFixed(2)}</strong>
                {hoverTime != null ? (
                  <>
                    {" "}
                    · t <strong>{formatTime(hoverTime)}</strong>
                  </>
                ) : null}
              </>
            ) : (
              "—"
            )}
          </div>
        </>
      )}
    </div>
  );
}
