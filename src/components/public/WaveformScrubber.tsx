"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/WaveformScrubber.tsx                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Renderizar una forma de onda "pro" (estilo SoundCloud): barras rellenas   │
 * │   simétricas (arriba/abajo), click-to-seek, HiDPI, y redibujo en resize.    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Este componente corre en el cliente (canvas).                             │
 * │ - Toma un Float32Array serializado en base64 (guardado en BD) y lo dibuja.  │
 * │ - Evita artefactos de “puntos/lineas” limitando columnas y con altura min.  │
 * │ - Si hay menos muestras que píxeles, NO “inventamos” más columnas que N;    │
 * │   distribuimos las N columnas a lo ancho.                                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";

type Props = {
  /** Waveform en base64 (Bytes de Float32) o null si no hay */
  waveformB64: string | null;
  /** Alto del canvas en px (default 96) */
  height?: number;
  /** Duración total (seg) para mapear X→tiempo cuando se hace click */
  durationSec?: number;
  /** Callback en seek (recibe segundos) */
  onSeek?: (timeSec: number) => void;
  /** Clases extra para el contenedor */
  className?: string;
  /** Máximo de columnas a dibujar (para no saturar) */
  maxColumns?: number; // default 1500
  /** Altura mínima de cada barra como fracción del alto (evita "puntos") */
  minBarFrac?: number; // default 0.02 => 2% del alto
};

/** base64 → Float32Array (los Bytes fueron guardados como Float32) */
function b64ToFloat32(b64: string): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

/** clamp a [-1, 1] y maneja NaN/Infinity */
function clampUnit(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v > 1) return 1;
  if (v < -1) return -1;
  return v;
}

export default function WaveformScrubber({
  waveformB64,
  height = 96,
  durationSec = 0,
  onSeek,
  className = "",
  maxColumns = 1500,
  minBarFrac = 0.02,
}: Props) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wfRef = React.useRef<Float32Array | null>(null);

  /** Dibujo principal (barras rellenas simétricas) */
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const wf = wfRef.current;

    if (!canvas || !wrapper || !wf || wf.length === 0) return;

    const cssW = Math.max(1, Math.floor(wrapper.clientWidth));
    const cssH = Math.max(1, Math.floor(height));
    const dpr = window.devicePixelRatio || 1;

    // Configuración HiDPI
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const g = canvas.getContext("2d");
    if (!g) return;

    // Fondo transparente (el contenedor pone el bg)
    g.clearRect(0, 0, canvas.width, canvas.height);

    // Color de las barras (blanco sutil para tu tema oscuro)
    g.fillStyle = "rgba(255,255,255,0.95)";

    const N = wf.length;

    // 👇 Número de columnas a dibujar:
    // - nunca más que N (para no repetir la misma muestra)
    // - nunca más que maxColumns (para no saturar)
    // - nunca más que el ancho en píxeles (no sentido dibujar > px)
    const colCount = Math.max(
      1,
      Math.min(N, maxColumns, cssW) // clave: evita “puntos”
    );

    // Espaciado entre columnas en px CSS; si hay muchas, el gap cae a 0
    const gapCss = colCount > 800 ? 0 : 1; // gap de 1px si hay “pocas” columnas
    const totalGapCss = gapCss * (colCount - 1);
    const barWcss = Math.max(1, Math.floor((cssW - totalGapCss) / colCount));

    const mid = (cssH * dpr) / 2;
    const minHalfBarPx = Math.max(1, Math.floor((cssH * dpr) * (minBarFrac / 2)));

    // Iteramos columnas; cada una usa un “bucket” de muestras
    for (let col = 0; col < colCount; col++) {
      const start = Math.floor((col * N) / colCount);
      let end = Math.floor(((col + 1) * N) / colCount);
      if (end <= start) end = Math.min(start + 1, N);

      // Obtenemos min/max reales del bucket
      let min = Infinity;
      let max = -Infinity;
      for (let i = start; i < end; i++) {
        const s = clampUnit(wf[i] ?? 0);
        if (s < min) min = s;
        if (s > max) max = s;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = 0;
        max = 0;
      }

      // Amplitud “simétrica” (look pro): usamos la mayor magnitud
      const amp = Math.max(Math.abs(min), Math.abs(max));

      // Altura total de la barra (doble, arriba y abajo)
      let half = Math.floor(amp * mid);
      if (half < minHalfBarPx) half = minHalfBarPx; // 👈 asegura que no quede “punto”

      // Coordenadas en canvas (HiDPI)
      const xCss = col * (barWcss + gapCss);
      const x = Math.floor(xCss * dpr);
      const w = Math.max(1, Math.floor(barWcss * dpr));

      const yTop = Math.floor(mid - half);
      const yBot = Math.floor(mid + half);

      // Barra superior
      g.fillRect(x, yTop, w, half);
      // Barra inferior (espejo)
      g.fillRect(x, mid, w, half);
    }
  }, [height, maxColumns, minBarFrac]);

  /** Decodifica waveform y dibuja */
  React.useEffect(() => {
    if (!waveformB64) {
      wfRef.current = null;
      const c = canvasRef.current;
      if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      return;
    }
    try {
      wfRef.current = b64ToFloat32(waveformB64);
    } catch {
      wfRef.current = null;
    }
    requestAnimationFrame(draw);
  }, [waveformB64, draw]);

  /** Redibuja en resize del contenedor */
  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(draw));
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [draw]);

  /** Click → seek (sólo si hay duración y callback) */
  function handleClick(e: React.MouseEvent) {
    if (!onSeek || !durationSec || durationSec <= 0) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const t = (x / (rect.width || 1)) * durationSec;
    onSeek(t);
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative select-none rounded-md bg-zinc-950/60 ring-1 ring-zinc-800 ${className}`}
      style={{ height }}
      aria-label="Forma de onda (clic para saltar)"
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
