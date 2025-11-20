// src/components/catalog/views/CardView.tsx
import type { Track } from "@/lib/catalog/types";
import { TagList } from "@/components/catalog/TrackTags";

interface CardViewProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayPause: (track: Track) => void;
}

export default function CardView({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayPause,
}: CardViewProps) {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            Vista 2 · Grid tipo marketplace
          </p>
          <h2 className="text-sm font-semibold text-neutral-50">
            Cards con foco en la pieza, no en la tabla
          </h2>
          <p className="mt-1 max-w-xl text-xs text-neutral-400">
            Cada tarjeta funciona como un “one-sheet” compacto del track,
            pensado para browsing visual y decisiones rápidas.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-neutral-400">
          <span className="rounded-full border border-neutral-700 px-2.5 py-0.5">
            {tracks.length} títulos
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tracks.map((track) => {
          const isActive = currentTrackId === track.id;
          const showPause = isActive && isPlaying;

          return (
            <article
              key={track.id}
              className="group flex flex-col justify-between rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950/95 p-4 shadow-lg shadow-black/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-50">
                    {track.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {track.artist}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onPlayPause(track)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs transition ${
                    isActive
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                      : "border-neutral-700 bg-neutral-950 text-neutral-100 hover:border-neutral-300"
                  }`}
                  aria-label={showPause ? "Pausar track" : "Reproducir track"}
                >
                  {showPause ? "⏸" : "▶"}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Moods
                  </p>
                  <TagList items={track.moods} variant="mood" />
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Usos sugeridos
                  </p>
                  <TagList items={track.uses} variant="use" />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-3">
                  {track.bpm && (
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                      {track.bpm} BPM
                    </span>
                  )}
                  {track.key && (
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5">
                      {track.key}
                    </span>
                  )}
                  <span>{track.duration}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-3 text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-neutral-700 px-2.5 py-1 text-[11px] text-neutral-200 hover:border-neutral-300"
                  >
                    Ver contrato
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-950 hover:bg-neutral-200"
                  >
                    Ver detalle
                  </button>
                </div>
                <span className="text-[11px] text-neutral-500">
                  ID: {track.id}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
