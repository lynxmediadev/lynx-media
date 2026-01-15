"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/lib/catalog/types";
import { MOCK_TRACKS } from "@/lib/catalog/mockTracks";
import TableView from "@/components/catalog/views/TableView";

/**
 * Página pública de catálogo:
 * - Subheader descriptivo.
 * - TableView (filtros + tabla densa).
 * - Player sticky al fondo del área de contenido clara.
 */
export default function CatalogPage() {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = useMemo<Track | null>(
    () => MOCK_TRACKS.find((track) => track.id === currentTrackId) ?? null,
    [currentTrackId],
  );

  const handlePlayPause = (track: Track) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (currentTrackId === track.id) {
      // Toggle play/pause sobre el mismo track
      if (isPlaying) {
        audioEl.pause();
        setIsPlaying(false);
      } else {
        audioEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Ignoramos errores de autoplay aquí
          });
      }
    } else {
      // Cambiar de track
      setCurrentTrackId(track.id);
      audioEl.src = track.audioUrl;
      audioEl
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audioEl.addEventListener("ended", handleEnded);
    return () => {
      audioEl.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div className="flex min-h-full flex-col gap-6 pb-10 border-0">
      {/* Sub-header local, debajo del header global del layout */}
      <section className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Lista de títulos
          </p>
          <p className="mt-1 max-w-2xl text-xs text-slate-600">
            Vista pensada para trabajo diario de supervisores/as y agencias:
            foco en rapidez para escuchar, comparar y entender el contexto de
            cada pieza.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 text-xs text-slate-600 md:items-end">
          <span className="rounded-xs border border-slate-300 bg-slate-50 px-3 py-1">
            Demo · {MOCK_TRACKS.length} tracks mock
          </span>
          <span className="text-[11px] text-slate-500">
            Próximo paso: conectar modelo <strong>Track</strong> vía Prisma.
          </span>
        </div>
      </section>

      {/* Vista principal */}
      <section className="flex-1">
        <TableView
          tracks={MOCK_TRACKS}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      </section>

      {/* Player sticky en el área clara */}
      <section className="sticky bottom-0 left-0 right-0 mt-6 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-4 px-2 py-3 sm:px-3 lg:px-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500">
              {currentTrack ? "Now" : "Idle"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">
                {currentTrack ? currentTrack.title : "Ningún track seleccionado"}
              </span>
              <span className="text-xs text-slate-600">
                {currentTrack
                  ? currentTrack.artist
                  : "Haz clic en ▶ en cualquier fila para reproducir."}
              </span>
            </div>
          </div>
          <div className="min-w-[220px] flex-1 sm:min-w-[260px] lg:min-w-[320px]">
            <audio
              ref={audioRef}
              className="w-full"
              controls
              preload="none"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
