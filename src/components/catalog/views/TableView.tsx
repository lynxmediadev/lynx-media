import type { Track } from "@/lib/catalog/types";
import { TagList } from "@/components/catalog/TrackTags";
import { Play, Pause } from "lucide-react";

interface TableViewProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayPause: (track: Track) => void;
}

/**
 * Vista principal del catálogo:
 * - Columna izquierda: filtros.
 * - Columna derecha: tabla densa.
 * Usa tokens de colores del catálogo.
 */
export default function TableView({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayPause,
}: TableViewProps) {
  return (
    <div className="grid gap-6 border-0 xl:grid-cols-[320px,1fr]">
      {/* Filtros */}
      <aside className="rounded-xl border border-[color:var(--lm-surface-border)] bg-[var(--lm-surface-bg)] p-4 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--lm-text-muted)] uppercase">
          Filtros
        </p>
        <h2 className="mt-2 text-sm font-semibold text-[var(--lm-text-main)]">
          Búsqueda rápida
        </h2>
        <p className="mt-1 text-xs text-[var(--lm-text-muted)]">
          Más adelante conectaremos estos controles a filtros reales (mood, uso,
          tempo, duración). Por ahora definen el lenguaje visual.
        </p>

        <div className="mt-4 space-y-4 text-xs text-[var(--lm-text-main)]">
          <div>
            <p className="mb-1 text-[11px] tracking-[0.16em] text-[var(--lm-text-muted)] uppercase">
              Tipo de catálogo
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--lm-accent)] bg-[var(--lm-accent-soft)] px-3 py-1 text-[11px] font-medium text-[var(--lm-text-main)]"
              >
                Todo
              </button>
              <button
                type="button"
                className="rounded-full border border-[color:var(--lm-surface-border)] bg-slate-50 px-3 py-1 text-[11px] text-[var(--lm-text-muted)] hover:border-[color:var(--lm-accent-alt)]"
              >
                Editorial
              </button>
              <button
                type="button"
                className="rounded-full border border-[color:var(--lm-surface-border)] bg-slate-50 px-3 py-1 text-[11px] text-[var(--lm-text-muted)] hover:border-[color:var(--lm-accent-alt)]"
              >
                One-Stop
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] tracking-[0.16em] text-[var(--lm-text-muted)] uppercase">
              Atajos de mood
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Tenso", "Emotivo", "Ligero", "Urbano"].map((label) => (
                <span
                  key={label}
                  className="cursor-default rounded-full border border-[color:var(--lm-surface-border)] bg-slate-50 px-2.5 py-0.5 text-[11px] text-[var(--lm-text-muted)]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Tabla densa */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--lm-surface-border)] bg-[var(--lm-surface-bg)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[color:var(--lm-surface-border)] px-4 py-3">
          <div>
            <p className="text-[11px] tracking-[0.16em] text-[var(--lm-text-muted)] uppercase">
              Catálogo
            </p>
            <p className="text-xs text-[var(--lm-text-muted)]">
              Lista compacta orientada a supervisión profesional.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-[var(--lm-text-muted)] sm:flex">
            <span className="rounded-full border border-[color:var(--lm-surface-border)] bg-slate-50 px-2.5 py-0.5">
              {tracks.length} tracks
            </span>
          </div>
        </div>

        <div className="scroll-region max-h-[34rem] overflow-y-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="text-[11px] tracking-[0.14em] text-[var(--lm-text-muted)] uppercase">
                <th className="px-3 py-2 text-left font-normal">Play</th>
                <th className="px-3 py-2 text-left font-normal">Track</th>
                <th className="px-3 py-2 text-left font-normal">Moods</th>
                <th className="px-3 py-2 text-left font-normal">Usos</th>
                <th className="px-3 py-2 text-right font-normal">Duración</th>
                <th className="px-3 py-2 text-right font-normal">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, index) => {
                const isActive = currentTrackId === track.id;
                const showPause = isActive && isPlaying;

                return (
                  <tr
                    key={track.id}
                    className={`border-t border-[color:var(--lm-surface-border)] ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-slate-100`}
                  >
                    <td className="px-3 py-2 align-middle">
                      <button></button>
                      <button
                        type="button"
                        onClick={() => onPlayPause(track)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold transition-colors transition-transform duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lm-play-bg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lm-page-bg)] ${
                          isActive
                            ? // Track activo → botón lleno, verde Spotify, icono blanco
                              "bg-[var(--lm-play-bg)] text-[var(--lm-play-icon)] shadow-md shadow-[rgba(0,0,0,0.18)] hover:scale-105 hover:bg-[var(--lm-play-bg-hover)]"
                            : // Track inactivo → borde verde, fondo blanco, se llena al hacer hover
                              "border border-[color:var(--lm-play-bg)] bg-white text-[var(--lm-play-bg)] hover:scale-105 hover:bg-[var(--lm-play-bg)] hover:text-[var(--lm-play-icon)]"
                        } `}
                        aria-label={
                          showPause ? "Pausar track" : "Reproducir track"
                        }
                      >
                        {showPause ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    <td className="px-3 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--lm-text-main)]">
                          {track.title}
                        </span>
                        <span className="text-xs text-[var(--lm-text-muted)]">
                          {track.artist}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <TagList items={track.moods} variant="mood" />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <TagList items={track.uses} variant="use" />
                    </td>
                    <td className="px-3 py-2 text-right align-middle text-xs text-[var(--lm-text-muted)]">
                      {track.duration}
                    </td>
                    <td className="px-3 py-2 text-right align-middle">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          className="rounded-full border border-[color:var(--lm-surface-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--lm-text-muted)] hover:border-[color:var(--lm-accent-alt)]"
                        >
                          Ver contrato
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-[var(--lm-accent)] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[var(--lm-accent-alt)]"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
