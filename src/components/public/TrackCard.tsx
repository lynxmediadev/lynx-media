"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/TrackCard.tsx                                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Tarjeta de catálogo con mini-player y mini-wave con progreso y seek.      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Mantiene un <audio> interno (D4 agregará bus global).                     │
 * │ - La mini-wave (canvas) dibuja barras centradas, sin línea de base.         │
 * │ - El progreso colorea una superposición “played”.                           │
 * │ - Click en la wave → `currentTime` y reproduce si estaba en pausa.          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import Link from "next/link";

export default function TrackCard(props: {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  durationSec: number;
  moods: string[];
  uses: string[];
  restrictions: string[];
  lufs: number | null;
  tp: number | null;
  waveformB64: string | null; // 👈 nuevo
}) {
  const {
    id, title, artist, audioUrl, durationSec,
    moods, uses, restrictions, lufs, tp, waveformB64,
  } = props;

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // 0..1

  // Eventos del <audio> para estado y progreso estable
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      if (!a.duration || !isFinite(a.duration)) return;
      setProgress(Math.min(1, Math.max(0, a.currentTime / a.duration)));
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    a.addEventListener("timeupdate", onTime);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
      a.removeEventListener("timeupdate", onTime);
    };
  }, []);

  async function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try { await a.play(); } catch {}
    } else {
      a.pause();
    }
  }

  // click-to-seek desde MiniWave
  async function handleSeekClick(normX: number) {
    const a = audioRef.current;
    if (!a || !a.duration || !isFinite(a.duration)) return;
    a.currentTime = normX * a.duration;
    // Si estaba en pausa, intentamos reproducir
    if (a.paused) {
      try { await a.play(); } catch {}
    }
  }

  const chip = (text: string, tone: "zinc" | "amber" | "rose" = "zinc") => {
    const map = {
      zinc: "bg-zinc-800/70 text-zinc-200",
      amber: "bg-amber-200/20 text-amber-200",
      rose: "bg-rose-200/20 text-rose-200",
    } as const;
    return (
      <span key={text}
        className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] ${map[tone]} ring-1 ring-inset ring-zinc-700`}>
        {text}
      </span>
    );
  };

  return (
    <article className="flex h-full flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3 shadow-lg shadow-black/10">
      <header className="mb-2">
        <h3 className="line-clamp-1 font-medium text-zinc-50">
          <Link href={`/track/${id}`} className="hover:underline" prefetch={false}>
            {title}
          </Link>
        </h3>
        <p className="text-xs text-zinc-400">{artist}</p>
      </header>

      {/* Mini player + mini wave */}
      <div className="my-2 rounded-md border border-zinc-800 p-2">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
            aria-label={playing ? "Pausar" : "Reproducir"}
            title={playing ? "Pausar" : "Reproducir"}
          >
            {playing ? "❚❚" : "►"}
          </button>
          <div className="text-xs text-zinc-400">
            {fmtDuration(durationSec)}
            {lufs != null ? ` · ${lufs.toFixed(1)} LUFS` : ""}
            {tp != null ? ` · TP ${tp.toFixed(2)} dBFS` : ""}
          </div>
        </div>

        {/* MiniWave: si hay waveform y duración */}
        {waveformB64 && durationSec > 0 ? (
          <MiniWave
            waveformB64={waveformB64}
            progress={progress}
            height={44}
            barWidth={3}   // más ancho para “fluidez”, sin gaps
            gap={0}
            backColor="rgba(255,255,255,0.16)"
            playedColor="#ffffff"
            onClickNorm={handleSeekClick}
          />
        ) : (
          <div className="text-center text-xs text-zinc-600">Sin forma de onda</div>
        )}

        <audio ref={audioRef} src={audioUrl} preload="none" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {moods.slice(0, 5).map((m) => chip(m))}
        {uses.slice(0, 4).map((u) => chip(u, "amber"))}
        {restrictions.slice(0, 2).map((r) => chip(r, "rose"))}
      </div>
    </article>
  );
}

function fmtDuration(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** MiniWave (canvas) — barras centradas, sin línea media, fondo tenue + overlay played */
function MiniWave({
  waveformB64,
  progress,
  height = 44,
  barWidth = 2,
  gap = 0,
  backColor = "rgba(255,255,255,0.16)",
  playedColor = "#fff",
  onClickNorm,
}: {
  waveformB64: string;
  progress: number;       // 0..1
  height?: number;
  barWidth?: number;
  gap?: number;
  backColor?: string;
  playedColor?: string;
  onClickNorm?: (normX: number) => void; // 0..1
}) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wfRef = React.useRef<Float32Array | null>(null);

  // b64 → Float32Array
  function decode(b64: string): Float32Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current, wf = wfRef.current;
    if (!canvas || !wrap || !wf || wf.length === 0) return;

    const wCss = wrap.clientWidth || 1;
    const hCss = height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(wCss * dpr));
    canvas.height = Math.max(1, Math.floor(hCss * dpr));
    canvas.style.width = `${wCss}px`;
    canvas.style.height = `${hCss}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Medidas
    const fullW = canvas.width;
    const fullH = canvas.height;
    const mid = fullH / 2;

    // Cuántas columnas caben según barWidth+gap (en CSS px, escalamos por dpr)
    const step = Math.max(1, Math.floor((barWidth + gap) * dpr));
    const cols = Math.max(1, Math.floor(fullW / step));
    const N = wf.length;

    // Función util para min/max en una “ventana” de muestras
    function minmax(start: number, end: number) {
      let mn = 1.0, mx = -1.0;
      for (let i = start; i < end; i++) {
        const v = wf[i] ?? 0;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      return [mn, mx] as const;
    }

    // Dibujo de barras: usamos `fillRect` (no líneas), centradas en el mid.
    function paintBars(color: string) {
      ctx.fillStyle = color;
      for (let c = 0; c < cols; c++) {
        const iStart = Math.floor((c / cols) * N);
        const iEnd = Math.floor(((c + 1) / cols) * N);
        const [mn, mx] = minmax(iStart, iEnd);
        const y1 = mid + mn * mid;
        const y2 = mid + mx * mid;
        const barH = Math.max(1, y2 - y1);
        // x posicionada según “step” (deja ‘gap’ si gap>0; 0 = juntitas)
        const x = c * step;
        // centramos la barrita dentro del step para estética
        const bw = Math.max(1, Math.floor(barWidth * dpr));
        const xPad = Math.max(0, Math.floor((step - bw) / 2));
        ctx.fillRect(x + xPad, y1, bw, barH);
      }
    }

    // Fondo tenue
    paintBars(backColor);

    // Overlay “played” con clip hasta X de progreso
    const cut = Math.max(0, Math.min(1, progress)) * fullW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cut, fullH);
    ctx.clip();
    paintBars(playedColor);
    ctx.restore();
  }, [height, barWidth, gap, backColor, playedColor, progress]);

  // Cargar waveform
  React.useEffect(() => {
    try {
      wfRef.current = decode(waveformB64);
    } catch {
      wfRef.current = null;
    }
    requestAnimationFrame(draw);
  }, [waveformB64, draw]);

  // Redibujar en resize
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(draw));
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  // Redibujo cuando cambia el progreso
  React.useEffect(() => {
    requestAnimationFrame(draw);
  }, [progress, draw]);

  function onClick(e: React.MouseEvent) {
    if (!onClickNorm) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    onClickNorm(x / rect.width); // normalizamos 0..1
  }

  return (
    <div
      ref={wrapRef}
      className="relative select-none rounded-md bg-zinc-950/60 ring-1 ring-zinc-800"
      style={{ height }}
      onClick={onClick}
      aria-label="Forma de onda (clic para saltar)"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClickNorm) {
          e.preventDefault();
          onClickNorm(progress); // con teclado, “repite” el punto actual
        }
      }}
      title="Click para saltar en el audio"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
