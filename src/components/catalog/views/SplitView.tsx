// src/components/catalog/views/SplitView.tsx
import { useState } from "react";
import type { Track } from "@/lib/catalog/types";
import { TagList } from "@/components/catalog/TrackTags";

interface SplitViewProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayPause: (track: Track) => void;
}

export default function SplitView({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayPause,
}: SplitViewProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    tracks[0]?.id ?? null,
  );

  const selectedTrack =
    tracks.find((track) => track.id === selectedTrackId) ?? tracks[0] ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr),minmax(0,1.4fr)]">
      <aside className="flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 shadow-lg shadow-black/40">
        <div className="border-b border-neutral-800 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            Vista 3 · Lista + detalle
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Pensada para sesiones con cliente: lista a la izquierda, ficha a la
            derecha.
          </p>
        </div>
        <div className="max-h-[30rem] overflow-y-auto">
          <ul className="divide-y divide-neutral-800/80 text-sm">
            {tracks.map((track) => {
              const isSelected = selectedTrack?.id === track.id;
              const isActive = currentTrackId === track.id;
              const showPause = isActive && isPlaying;

              return (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                      isSelected
                        ? "bg-neutral-800/80"
                        : "hover:bg-neutral-800/40"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-neutral-50">
                        {track.title}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {track.artist}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-neutral-500">
                        {track.moods[0] && <span>{track.moods[0]}</span>}
                        {track.uses[0] && <span>· {track.uses[0]}</span>}
                        <span>· {track.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPlayPause(track);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition ${
                          isActive
                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                            : "border-neutral-700 bg-neutral-950 text-neutral-100 hover:border-neutral-300"
                        }`}
                        aria-label={showPause ? "Pausar track" : "Reproducir track"}
                      >
                        {showPause ? "⏸" : "▶"}
                      </button>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-xl shadow-black/40">
        {selectedTrack ? (
          <div className="flex h-full flex-col gap-4">
            <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  Ficha del track
                </p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-50">
                  {selectedTrack.title}
                </h2>
                <p className="text-xs text-neutral-400">
                  {selectedTrack.artist}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPlayPause(selectedTrack)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    currentTrackId === selectedTrack.id && isPlaying
                      ? "bg-emerald-400 text-neutral-950"
                      : "border border-neutral-700 bg-neutral-950 text-neutral-100 hover:border-neutral-300"
                  }`}
                >
                  <span>
                    {currentTrackId === selectedTrack.id && isPlaying
                      ? "Pausar"
                      : "Reproducir"}
                  </span>
                  <span>
                    {currentTrackId === selectedTrack.id && isPlaying
                      ? "⏸"
                      : "▶"}
                  </span>
                </button>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Moods principales
                  </p>
                  <TagList items={selectedTrack.moods} variant="mood" />
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Usos sugeridos
                  </p>
                  <TagList items={selectedTrack.uses} variant="use" />
                </div>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-neutral-500">Duración</span>
                  <span>{selectedTrack.duration}</span>
                  <span className="text-neutral-500">BPM</span>
                  <span>{selectedTrack.bpm ?? "—"}</span>
                  <span className="text-neutral-500">Tonalidad</span>
                  <span>{selectedTrack.key ?? "—"}</span>
                  <span className="text-neutral-500">ID interno</span>
                  <span>{selectedTrack.id}</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Aquí más adelante se puede exponer información de derechos,
                  territorios, licencias, etc.
                </p>
              </div>
            </div>

            <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-3 text-xs">
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
              <p className="text-[11px] text-neutral-500">
                Pensado para tener la conversación de sincronización mirando la
                misma ficha con el cliente.
              </p>
            </footer>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No hay tracks disponibles.
          </div>
        )}
      </section>
    </div>
  );
}
