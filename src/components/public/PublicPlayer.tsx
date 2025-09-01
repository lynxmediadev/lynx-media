"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/PublicPlayer.tsx                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Reproductor mínimo con <audio>, título/autor y WaveformScrubber.          │
 * │ - Al hacer click en el waveform → hace seek en el <audio>.                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Mantiene la UI simple y accesible (botón play/pause con aria-label).      │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import WaveformScrubber from "./WaveformScrubber";

export default function PublicPlayer({
  src,
  title,
  artist,
  waveformB64,
  durationSec,
}: {
  src: string;
  title?: string;
  artist?: string;
  waveformB64: string | null;
  durationSec?: number;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    function onPlay() { setPlaying(true); }
    function onPause() { setPlaying(false); }
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200"
          aria-label={playing ? "Pausar" : "Reproducir"}
          type="button"
        >
          {playing ? "❚❚" : "►"}
        </button>
        <div className="min-w-0">
          <div className="truncate text-sm text-zinc-400">{artist ?? "—"}</div>
          <div className="truncate text-base font-semibold text-zinc-100">{title ?? "Untitled"}</div>
        </div>
      </div>

      <div className="mt-4">
        <WaveformScrubber
          waveformB64={waveformB64}
          durationSec={durationSec}
          height={80}
          onSeek={(t) => {
            const a = audioRef.current;
            if (!a || !isFinite(t)) return;
            a.currentTime = Math.max(0, Math.min(t, a.duration || t));
            if (a.paused) a.play().catch(() => {});
          }}
        />
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}
