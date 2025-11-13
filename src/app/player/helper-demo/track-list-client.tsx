"use client";
/**
 * ============================================================================
 * Archivo: src/app/player/helper-demo/track-list-client.tsx
 * Tipo: Client Component
 * Objetivo (peras y manzanas):
 * - Renderizar la lista de tracks y manejar interactividad (onClick).
 * - Aquí SÍ podemos usar handlers y estado (porque es "use client").
 * - Mantener desacoplado el fetch (lo hace el Server Component contenedor).
 * ============================================================================
 */

import * as React from "react";
import { Button } from "@/components/ui/button";

type TrackLite = {
  id: string;
  title: string;
  artist: string | null;
  audioUrl: string | null;
  durationSec: number | null;
};

export default function HelperDemoClient({ tracks }: { tracks: TrackLite[] }) {
  // Ejemplo mínimo de “store” local para la demo (reemplázalo por tu player real)
  const [currentId, setCurrentId] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const play = (t: TrackLite) => {
    console.log("[demo] play", t.id);
    setCurrentId(t.id);
    setIsPlaying(true);
    // Aquí dispararías tu player real: usePlayerStore.getState().play(t)
  };

  const pause = (t: TrackLite) => {
    console.log("[demo] pause", t.id);
    if (currentId === t.id) setIsPlaying(false);
    // Aquí pausarías tu player real: usePlayerStore.getState().pause()
  };

  const enqueue = (t: TrackLite) => {
    console.log("[demo] enqueue next", t.id);
    // Aquí agregarías a la cola real: usePlayerStore.getState().enqueue(t)
  };

  return (
    <section className="space-y-3">
      {tracks.map((t) => (
        <article
          key={t.id}
          className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {t.title} <span className="text-zinc-400">— {t.artist ?? "Unknown"}</span>
            </div>
            <div className="text-xs text-zinc-500">
              {t.durationSec ? `${t.durationSec}s` : "sin duración"}
              {currentId === t.id && (
                <span className="ml-2 text-zinc-300">({isPlaying ? "playing" : "paused"})</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={() => play(t)} title="Play" variant="default">
              ▶︎
            </Button>
            <Button onClick={() => pause(t)} title="Pause" variant="secondary">
              ❚❚
            </Button>
            <Button onClick={() => enqueue(t)} title="Enqueue" variant="outline">
              ➕
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
}
