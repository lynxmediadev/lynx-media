"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/PublicPlayer.tsx                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Player con botón grande, título/autor y waveform interactivo.             │
 * │ - Click en waveform = seek + **auto-play si estaba pausado**.               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - El estado “playing” se actualiza con eventos del <audio> (play/pause).    │
 * │ - Evitamos play/pause “a la vez” para no disparar el warning de Chrome.     │
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
  const [cur, setCur] = React.useState(0);
  const [dur, setDur] = React.useState(durationSec || 0);

  // Eventos de audio → estado real
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onMeta = () => setDur(a.duration || durationSec || 0);
    const onTime = () => setCur(a.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [durationSec]);

  // Botón play/pause
  async function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try { await a.play(); } catch { /* ignoramos error de autoplay */ }
    } else {
      a.pause();
    }
  }

  // Click en waveform → seek + auto-play si estaba pausado
  function handleSeek(t: number) {
    const a = audioRef.current;
    if (!a) return;
    const total = a.duration || dur || 0;
    a.currentTime = Math.max(0, Math.min(t, total));
    if (a.paused) a.play().catch(() => {});
  }

  const progress = !dur ? 0 : Math.max(0, Math.min(1, cur / (dur || 1)));

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
          <div className="truncate text-base font-semibold text-zinc-100">
            {title ?? "Untitled"}
          </div>
        </div>
        <div className="ml-auto text-xs tabular-nums text-zinc-400">
          {/* opcional: {fmtTime(cur)} / {fmtTime(dur)} */}
        </div>
      </div>

      <div className="mt-4">
        <WaveformScrubber
          waveformB64={waveformB64}
          durationSec={dur}
          height={80}
          progress={progress}
          onSeek={handleSeek}
          barWidth={4}
          gap={0}
          colors={{ base: "rgba(255,255,255,0.18)", progress: "#fff" }}
        />
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}
