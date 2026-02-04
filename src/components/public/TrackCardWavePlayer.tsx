"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/TrackCardWavePlayer.tsx                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Mini-player para las tarjetas del catálogo: Play/Pause + forma de onda.   │
 * │ - Misma estética que la ficha pública (barras sin gaps, progreso blanco).   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Es Client Component: maneja <audio>, progreso y seeks en el navegador.     │
 * │ - Reusa tu WaveformScrubber (coloreamos “progreso” en blanco).              │
 * │ - Si haces click en la onda estando en pausa → auto-play desde ese punto.   │
 * │ - Pausa cualquier otro audio del catálogo para evitar “doble reproducción”. │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import WaveformScrubber from "@/components/public/WaveformScrubber";
import { Pause, Play } from "lucide-react";

type Props = {
  src: string | null;                // URL de audio público (R2 o directo)
  waveformB64: string | null;        // Waveform base64 (Bytes Float32 → base64)
  durationSec?: number;              // Para mapear X→tiempo en el seek
  className?: string;
  height?: number;                   // Alto del canvas (default 64)
};

export default function TrackCardWavePlayer({
  src,
  waveformB64,
  durationSec = 0,
  className = "",
  height = 64,
}: Props) {
  const idRef = React.useRef(`card-audio-${Math.random().toString(36).slice(2)}`);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Estado de reproducción y progreso 0..1 (para “progreso blanco” en la onda)
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // ———————————————————————————————————————————————————————————————
  // Pausar otros audios del catálogo al darle Play a éste (bus simple)
  // ———————————————————————————————————————————————————————————————
  React.useEffect(() => {
    function onPauseOthers(evt: Event) {
      const e = evt as CustomEvent<{ exceptId: string }>;
      if (e.detail?.exceptId !== idRef.current) {
        const a = audioRef.current;
        if (a && !a.paused) a.pause();
      }
    }
    window.addEventListener("lynx:pause-others", onPauseOthers as EventListener);
    return () => {
      window.removeEventListener("lynx:pause-others", onPauseOthers as EventListener);
    };
  }, []);

  function pauseOthers() {
    window.dispatchEvent(new CustomEvent("lynx:pause-others", { detail: { exceptId: idRef.current } }));
  }

  // ———————————————————————————————————————————————————————————————
  // Handlers del <audio>
  // ———————————————————————————————————————————————————————————————
  function togglePlay() {
    const a = audioRef.current;
    if (!a || !src) return;

    if (a.paused) {
      pauseOthers();
      a.play().then(() => setIsPlaying(true)).catch(() => {
        // En caso de bloqueo de autoplay, no hacemos nada extraño.
        setIsPlaying(!a.paused);
      });
    } else {
      a.pause();
      setIsPlaying(false);
    }
  }

  function onTimeUpdate() {
    const a = audioRef.current;
    if (!a || !isFinite(a.currentTime) || !isFinite(a.duration) || a.duration <= 0) {
      setProgress(0);
      return;
    }
    setProgress(a.currentTime / a.duration);
  }

  function onEnded() {
    setIsPlaying(false);
    setProgress(0);
  }

  // Seek desde la onda (si estaba en pausa, reproducimos)
  function handleSeek(timeSec: number) {
    const a = audioRef.current;
    if (!a || !src) return;
    try {
      a.currentTime = Math.max(0, Math.min(timeSec, a.duration || durationSec || 0));
      // Si estaba en pausa, reproducimos desde aquí
      if (a.paused) {
        pauseOthers();
        void a.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(!a.paused);
        });
      }
    } catch {
      // no-op
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Botón Play/Pause “minimal cine” */}
      <button
        type="button"
        onClick={togglePlay}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/70 bg-zinc-900/40 text-zinc-50 hover:bg-zinc-800/60"
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Forma de onda pro (sin gaps, progreso blanco) */}
      <div className="flex-1">
        <WaveformScrubber
          waveformB64={waveformB64}
          durationSec={durationSec}
          height={height}
          progress={progress}
          onSeek={handleSeek}
          // Estética idéntica a la ficha pública:
          barWidth={4}
          gap={0}
          colors={{ base: "rgba(255,255,255,0.18)", progress: "#fff" }}
          className="w-full"
        />
      </div>

      {/* El <audio> real (oculto) */}
      {/* Nota: no usamos controls nativos; lo gobernamos con el botón y la onda */}
      <audio
        ref={audioRef}
        src={src ?? undefined}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        data-role="catalog-audio"
      />
    </div>
  );
}
