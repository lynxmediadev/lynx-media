import type { Track } from "@/lib/catalog/types";
import { TagList } from "@/components/catalog/TrackTags";

interface TableViewProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayPause: (track: Track) => void;
}

/**
 * Vista principal del catálogo:
 * - Columna izquierda: filtros (card blanca).
 * - Columna derecha: tabla densa en card blanca.
 * - Contenido claro, inspirado en Supabase/Velzon.
 */
export default function TableView({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayPause,
}: TableViewProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr] border-0">
      {/* Filtros */}
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Filtros
        </p>
        <h2 className="mt-2 text-sm font-semibold text-slate-900">
          Búsqueda rápida
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Más adelante conectaremos estos controles a filtros reales
          (mood, uso, tempo, duración). Por ahora definen el lenguaje visual.
        </p>

        <div className="mt-4 space-y-4 text-xs text-slate-700">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Tipo de catálogo
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-slate-400"
              >
                Todo
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-slate-400"
              >
                Editorial
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-slate-400"
              >
                One-Stop
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Atajos de mood
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Tenso", "Emotivo", "Ligero", "Urbano"].map((label) => (
                <span
                  key={label}
                  className="cursor-default rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Tabla densa */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Catálogo
            </p>
            <p className="text-xs text-slate-500">
              Lista compacta orientada a supervisión profesional.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5">
              {tracks.length} tracks
            </span>
          </div>
        </div>

        <div className="max-h-[34rem] overflow-y-auto scroll-region">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
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
                    className={`border-t border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-slate-100`}
                  >
                    <td className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => onPlayPause(track)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          isActive
                            ? "border-[#3ECF8E] bg-[#3ECF8E]/10 text-[#0F172A]"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-500"
                        }`}
                        aria-label={showPause ? "Pausar track" : "Reproducir track"}
                      >
                        {showPause ? "⏸" : "▶"}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {track.title}
                        </span>
                        <span className="text-xs text-slate-500">
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
                    <td className="px-3 py-2 text-right align-middle text-xs text-slate-600">
                      {track.duration}
                    </td>
                    <td className="px-3 py-2 text-right align-middle">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-slate-500"
                        >
                          Ver contrato
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-[#11181C] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-black"
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
