"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/PublicAudioBar.tsx                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Reproductor compacto: botón play/pause + tiempo + forma de onda clickable │
 * │   que además **auto-reproduce** si estaba en pausa al hacer click en la onda│
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Usamos un <audio> oculto y lo controlamos con refs.                       │
 * │ - El estado `isPlaying` se actualiza SOLO por eventos del <audio>           │
 * │   (play/pause/ended), no al “dedo”; así evitamos el warning de play/pause.  │
 * │ - En `onSeek`: movemos currentTime y, si estaba pausado, llamamos a play(). │
 * │ - Pasamos `progress` (0..1) al WaveformScrubber para colorear el avance.    │
 * │ - Layout adaptado para admin/tech: columna izquierda (Play+tiempo) +        │
 * │   columna derecha (waveform) con alturas equivalentes.                      │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import WaveformScrubber from "./WaveformScrubber";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  durationSec?: number; // fallback de duración (si no hay metadata del audio aún)
  waveformB64: string | null;
  interactive?: boolean;
  waveformColors?: { base?: string; progress?: string };
  className?: string;
  frameClassName?: string;
};

function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function PublicAudioBar({
  src,
  durationSec = 0,
  waveformB64,
  interactive = true,
  waveformColors,
  className,
  frameClassName,
}: Props) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Estado derivado **solo** por eventos del <audio>
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [cur, setCur] = React.useState(0);
  const [dur, setDur] = React.useState(durationSec || 0);

  const disabled = !src;

  // Suscribimos eventos del <audio> para mantener el estado “de verdad”
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onMeta = () => setDur(el.duration || durationSec || 0);
    const onTime = () => setCur(el.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [durationSec]);

  // Botón play/pause
  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play(); // los eventos actualizarán isPlaying
      } catch {
        /* autoplay bloqueado u otro detalle */
      }
    } else {
      el.pause(); // evento “pause” actualizará isPlaying
    }
  }

  // Click en waveform → mover el tiempo
  function handleSeek(sec: number) {
    const el = audioRef.current;
    if (!el || !dur) return;

    // 1) Clamp y asignación del tiempo
    el.currentTime = Math.max(0, Math.min(sec, dur));

    // 2) Si estaba en pausa, reproducimos (gesto de usuario → permitido)
    if (el.paused) {
      el.play().catch(() => {
        /* si falla, lo ignoramos; no forzamos estado manual */
      });
    }
  }

  // Progreso para pintar la parte “reproducida”
  const progress = !dur ? 0 : Math.max(0, Math.min(1, cur / dur));

  return (
    <div className={cn("rounded-[2px] border border-border bg-card/80 p-3 shadow-sm", className)}>
      <div className="flex items-stretch gap-3">
        {/* Columna izquierda: Play (arriba) + tiempo (abajo) */}
        <div className="flex min-h-[64px] w-[128px] min-w-[128px] flex-col justify-between">
          <button
            type="button"
            className={cn(
              "flex h-10 items-center justify-center rounded-[2px] border border-border bg-background px-3 text-sm font-medium transition",
              disabled
                ? "cursor-not-allowed opacity-70"
                : "text-foreground hover:bg-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            onClick={toggle}
            disabled={disabled}
          >
            <span className="sr-only">{isPlaying ? "Pausar" : "Reproducir"}</span>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <div className="mt-1 flex h-9 items-center justify-center rounded-[2px] bg-background/70 px-2 text-[11px] tabular-nums text-muted-foreground ring-1 ring-border/70">
            {fmtTime(cur)} / {fmtTime(dur)}
          </div>
        </div>

        {/* Columna derecha: waveform (misma “altura visual” que la columna de controles) */}
        <div className="flex min-h-[64px] flex-1 items-center">
          <WaveformScrubber
            waveformB64={waveformB64}
            height={72} // un poco más bajo que 80 para compactar (ajustable)
            durationSec={dur}
            progress={progress}
            onSeek={interactive ? handleSeek : undefined}
            className="w-full"
            barWidth={3} // barras compactas pero sólidas
            gap={0} // sin huecos entre barras
            frameClassName={frameClassName}
            colors={{
              base: waveformColors?.base ?? "__theme_base__", // COLOR BASE DEL PLAYER
              progress: waveformColors?.progress ?? "__theme_progress__", // COLOR DE AVANCE PLAYER
            }}
          />
        </div>
      </div>

      {/* Audio real (oculto pero controlado por ref) */}
      <audio ref={audioRef} src={src ?? undefined} preload="metadata" />
    </div>
  );
}
