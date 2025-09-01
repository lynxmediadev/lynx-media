"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/WaveformScrubber.tsx                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Dibuja una forma de onda "tipo Artlist": silueta continua rellena,        │
 * │   con overlay de progreso.                                                   │
 * │ - Sin trazo, sin línea central (solo fill).                                  │
 * │ - Re-muestrea tu Float32Array al ancho del canvas y aplica un suavizado      │
 * │   ligero para que la silueta se vea fluida.                                   │
 * │ - Click-to-seek: emite onSeek(seg).                                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Este componente no maneja el <audio>; solo dibuja y calcula el seek.       │
 * │ - El padre debe pasar `progress` (0..1) y `onSeek`.                           │
 * │ - No necesitas "más muestras" en BD: re-muestreamos internamente.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";

type Props = {
  waveformB64: string | null;                 // Float32 (bytes) en base64 desde BD
  height?: number;                            // alto del canvas en px
  durationSec?: number;                       // duración total (para mapear clicks)
  progress?: number;                          // 0..1, progreso actual
  onSeek?: (timeSec: number) => void;         // callback al click
  className?: string;
  colors?: {
    base?: string;                            // color parte no reproducida
    progress?: string;                        // color parte reproducida
  };
  smooth?: boolean;                           // suavizar la silueta (default true)
  smoothWindow?: number;                      // ventana del suavizado (píxeles virtuales)
};

/** base64 → Float32Array (bytes de float32) */
function b64ToFloat32(b64: string): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

/** Re-muestrea a `cols` columnas: tomamos el pico (max |v|) por columna */
function resamplePeaksAbs(src: Float32Array, cols: number): Float32Array {
  const out = new Float32Array(cols);
  const N = src.length;
  for (let c = 0; c < cols; c++) {
    const start = Math.floor((c / cols) * N);
    const end = Math.max(start + 1, Math.floor(((c + 1) / cols) * N));
    let peak = 0;
    for (let i = start; i < end; i++) {
      const v = Math.abs(src[i] ?? 0);
      if (v > peak) peak = v;
    }
    out[c] = peak; // 0..1
  }
  return out;
}

/** Suavizado caja (moving average) muy ligero para redondear la silueta */
function smoothBox(src: Float32Array, window = 3): Float32Array {
  if (window <= 1) return src;
  const out = new Float32Array(src.length);
  const half = Math.floor(window / 2);
  for (let i = 0; i < src.length; i++) {
    let sum = 0;
    let cnt = 0;
    for (let k = -half; k <= half; k++) {
      const j = i + k;
      if (j >= 0 && j < src.length) {
        sum += src[j]!;
        cnt++;
      }
    }
    out[i] = sum / (cnt || 1);
  }
  return out;
}

export default function WaveformScrubber({
  waveformB64,
  height = 80,
  durationSec = 0,
  progress = 0,
  onSeek,
  className = "",
  colors = { base: "rgba(255,255,255,0.22)", progress: "rgba(255,255,255,0.95)" },
  smooth = true,
  smoothWindow = 5,
}: Props) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wfRef = React.useRef<Float32Array | null>(null);
  const peaksRef = React.useRef<Float32Array | null>(null); // picos re-muestreados (0..1)

  /** Recalcula picos al tamaño actual */
  const recompute = React.useCallback(() => {
    const c = canvasRef.current;
    const w = wrapperRef.current;
    const wf = wfRef.current;
    if (!c || !w || !wf || wf.length === 0) return;

    const cssW = Math.max(1, Math.floor(w.clientWidth));
    const cssH = height;
    const dpr = window.devicePixelRatio || 1;

    c.width = cssW * dpr;
    c.height = cssH * dpr;
    c.style.width = `${cssW}px`;
    c.style.height = `${cssH}px`;

    // Re-muestreamos a una columna por pixel (look continuo)
    let peaks = resamplePeaksAbs(wf, cssW);

    // Suavizado ligero (opcional)
    if (smooth) {
      peaks = smoothBox(peaks, smoothWindow);
    }
    peaksRef.current = peaks;
  }, [height, smooth, smoothWindow]);

  /** Dibuja silueta y overlay de progreso */
  const draw = React.useCallback(
    (p: number) => {
      const c = canvasRef.current;
      const peaks = peaksRef.current;
      if (!c || !peaks) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const W = c.width;      // px reales (DPR)
      const H = c.height;
      const cols = peaks.length;
      const mid = H / 2;

      // helper: genera el path de la silueta en el ctx (superior + inferior)
      const makePath = () => {
        ctx.beginPath();
        // Borde superior izquierda → derecha
        for (let xCSS = 0; xCSS < cols; xCSS++) {
          const peak = peaks[xCSS]!;
          const yTop = mid - peak * mid;
          const x = Math.round(xCSS * dpr);
          ctx.lineTo(x, yTop);
        }
        // Borde inferior derecha → izquierda (cerramos la "gota")
        for (let xCSS = cols - 1; xCSS >= 0; xCSS--) {
          const peak = peaks[xCSS]!;
          const yBottom = mid + peak * mid;
          const x = Math.round(xCSS * dpr);
          ctx.lineTo(x, yBottom);
        }
        ctx.closePath();
      };

      // Limpiamos
      ctx.clearRect(0, 0, W, H);

      // BASE
      ctx.fillStyle = colors.base ?? "rgba(255,255,255,0.22)";
      makePath();
      ctx.fill();

      // PROGRESO (clip 0..p*W)
      const clipW = Math.max(0, Math.min(W, Math.round(W * (p || 0))));
      if (clipW > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, clipW, H);
        ctx.clip();

        ctx.fillStyle = colors.progress ?? "rgba(255,255,255,0.95)";
        makePath();
        ctx.fill();

        ctx.restore();
      }
    },
    [colors.base, colors.progress],
  );

  /** Cargar/decodificar waveform */
  React.useEffect(() => {
    if (!waveformB64) {
      wfRef.current = null;
      peaksRef.current = null;
      const c = canvasRef.current;
      c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      return;
    }
    try {
      wfRef.current = b64ToFloat32(waveformB64);
    } catch {
      wfRef.current = null;
    }
    requestAnimationFrame(() => {
      recompute();
      draw(progress);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveformB64]);

  /** Redibuja en resize */
  React.useEffect(() => {
    const w = wrapperRef.current;
    if (!w) return;
    const ro = new ResizeObserver(() => {
      recompute();
      draw(progress);
    });
    ro.observe(w);
    return () => ro.disconnect();
  }, [recompute, draw, progress]);

  /** Sólo repintamos cuando cambia el progreso */
  React.useEffect(() => {
    draw(Math.max(0, Math.min(1, progress || 0)));
  }, [progress, draw]);

  /** Click → seek */
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
      {/* Canvas: solo fill; sin línea central */}
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
