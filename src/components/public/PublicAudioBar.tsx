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
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import WaveformScrubber from "./WaveformScrubber";

type Props = {
  src: string | null;
  durationSec?: number; // fallback de duración (si no hay metadata del audio aún)
  waveformB64: string | null;
  interactive?: boolean;
  waveformColors?: { base?: string; progress?: string };
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
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className={`rounded-md border px-3 py-1.5 text-sm ${
            disabled
              ? "cursor-not-allowed border-zinc-800 text-zinc-700"
              : "border-zinc-700 text-zinc-100 hover:bg-zinc-900"
          }`}
          onClick={toggle}
          disabled={disabled}
        >
          {isPlaying ? "❚❚" : "►"}
        </button>

        <div className="text-xs tabular-nums text-zinc-400">
          {fmtTime(cur)} / {fmtTime(dur)}
        </div>
      </div>

      {/* Forma de onda (sin “línea media”; barras centradas y coloreadas por progreso) */}
      <WaveformScrubber
        waveformB64={waveformB64}
        height={80}
        durationSec={dur}
        progress={progress}
        onSeek={interactive ? handleSeek : undefined}
        className="w-full"
        barWidth={4} // barras más anchas = look sólido
        gap={0} // sin huecos entre barras
        colors={{
          base: waveformColors?.base ?? "rgba(255,255,255,0.18)", // COLOR BASE DEL PLAYER
          progress: waveformColors?.progress ?? "#fff", // COLOR DE AVANCE PLAYER
        }}
      />

      {/* Audio real (oculto pero controlado por ref) */}
      <audio ref={audioRef} src={src ?? undefined} preload="metadata" />
    </div>
  );
}
