"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/PublicAudioBar.tsx                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Player minimal (play/pause + tiempo) + integración **estable** con        │
 * │   WaveformScrubber (click-seek).                                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Es Client Component.                                                       │
 * │ - Mantiene el audio nativo (<audio>) para máxima compatibilidad.            │
 * │ - WaveformScrubber sólo dibuja y permite click-to-seek (sin tooltip).       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import WaveformScrubber from "@/components/public/WaveformScrubber";

type Props = {
  src: string | null;
  durationSec: number;
  waveformB64: string | null;
};

function fmtTime(t: number) {
  if (!isFinite(t) || t < 0) return "0:00";
  const s = Math.floor(t);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function PublicAudioBar({ src, durationSec, waveformB64 }: Props) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);

  // Bind de eventos del <audio>
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime || 0);
    const onEnd = () => setIsPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  // Play/Pause
  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      await el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }

  // Seek desde el waveform
  function handleSeek(sec: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, sec), durationSec || el.duration || 0);
    // Si estaba en pause, reproducimos para que el feedback sea inmediato
    if (el.paused) {
      el.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
      {/* Barra superior: controles básicos */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={toggle}
          className="rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700"
          disabled={!src}
          title={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? "Pausar" : "Reproducir"}
        </button>
        <div className="text-xs tabular-nums text-zinc-300">
          {fmtTime(time)} / {fmtTime(durationSec || 0)}
        </div>
      </div>

      {/* Forma de onda: estable, sin tooltip */}
      <WaveformScrubber
        waveformB64={waveformB64}
        durationSec={durationSec || 0}
        onSeek={handleSeek}
        height={72}
      />

      {/* Audio nativo (no visible) */}
      <audio ref={audioRef} src={src ?? undefined} preload="metadata" />
    </div>
  );
}
