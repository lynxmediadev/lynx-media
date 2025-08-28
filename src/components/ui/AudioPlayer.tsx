// ================================================
// File: src/components/ui/AudioPlayer.tsx
// Título: AudioPlayer mínimo (estable)
// Descripción: Reproductor simple con play/pause, progreso y tiempos.
// Qué hace: Evita que la página se rompa; listo para /player/api-demo.
// Peras y manzanas: “Un walkman básico que siempre funciona.”
// ================================================
"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";

type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
};

export function AudioPlayer({ track }: { track: PlayerTrack }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onLoaded = () => setDuration(el.duration || 0);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  React.useEffect(() => {
    // Si cambia el track.audioUrl, resetea
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = track.audioUrl;
      el.load();
    }
  }, [track.audioUrl]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  function onSeek(v: number[]) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const p = (v[0] ?? 0) / 100;
    el.currentTime = p * duration;
    setCurrent(el.currentTime);
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, "0")}`;
    };

  return (
    <div className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <img
        src={track.coverUrl ?? "/images/hero/hero-bg-1.png"}
        alt={track.title}
        className="h-14 w-14 rounded-lg object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">{track.title}</div>
            <div className="truncate text-sm text-muted-foreground">{track.artist}</div>
          </div>
          <button
            onClick={toggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent"
            aria-label={playing ? "Pausar" : "Reproducir"}
          >
            {playing ? "❚❚" : "►"}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
            {fmt(current)}
          </span>
          <Slider value={[pct]} onValueChange={onSeek} aria-label="Progreso" />
          <span className="w-12 text-xs tabular-nums text-muted-foreground">
            {duration ? fmt(duration) : "-:-"}
          </span>
        </div>
      </div>

      <audio ref={audioRef} src={track.audioUrl} preload="metadata" />
    </div>
  );
}
