// src/app/admin/analyze/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Admin · /admin/analyze                                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Lista todos los tracks con foco en su estado técnico de análisis.        │
 * │ - Muestra: título, artista, estado (audio/análisis), asset, métricas de    │
 * │   audio (LUFS, LRA, True Peak, duración, sample rate) y acciones.          │
 * │ - Tabla contenida en una card que actúa como contenedor visual rígido:     │
 * │   la tabla no se “sale” del borde gracias a overflow-hidden.               │
 * │ - Columna AUDIO simplificada (texto técnico compacto) y columna ASSET      │
 * │   mucho más estrecha (link corto clickeable).                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - El <main> ahora usa w-full max-w-6xl, NO w-[80vw].                        │
 * │ - La sección que contiene la tabla tiene overflow-hidden, por lo que       │
 * │   ningún contenido puede pintar fuera de la tarjeta.                        │
 * │ - AUDIO: texto técnico legible y compacto, no tantos “chips” anchos.       │
 * │ - ASSET: texto corto (“Abrir audio (R2)” / “Abrir audio externo”) que      │
 * │   ahorra espacio horizontal.                                               │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { prisma } from "@/server/prisma";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import { getS3PublicUrl } from "@/lib/storage/s3";

export const dynamic = "force-dynamic";

type AnalyzeRow = {
  id: string;
  title: string | null;
  artist: string | null;
  createdAt: Date;
  updatedAt: Date;
  analysisAt: Date | null;
  assetKey: string | null;
  audioUrl: string | null;
  durationSec: number | null;
  sampleRateHz: number | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
};

export default async function Page() {
  const tracks = await prisma.track.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      artist: true,
      createdAt: true,
      updatedAt: true,
      analysisAt: true,
      assetKey: true,
      audioUrl: true,
      durationSec: true,
      sampleRateHz: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      truePeakDbfs: true,
    },
  });

  return (
    <main className="mx-auto w-full max-w-7xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-50">
          Análisis técnico de tracks
        </h1>
        <p className="text-sm text-zinc-400">
          Panel de control para revisar el estado de análisis de cada track,
          métricas de audio y acceso rápido a la ficha técnica.
        </p>
      </header>

      {/* Contenedor rígido de la tabla: nada puede pintarse fuera del borde */}
      <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70 backdrop-blur">
        <div className="border-b border-zinc-800 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {tracks.length} track{tracks.length === 1 ? "" : "s"} en catálogo
        </div>

        <table className="w-full table-auto text-sm">
          <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left align-middle">Track</th>
              <th className="px-4 py-3 text-left align-middle">Estado</th>
              <th className="px-4 py-3 text-left align-middle">Asset</th>
              <th className="px-4 py-3 text-left align-middle">Audio</th>
              <th className="px-4 py-3 text-left align-middle">Analizado</th>
              <th className="px-4 py-3 text-right align-middle">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-xs text-zinc-500"
                >
                  No hay tracks registrados todavía.
                </td>
              </tr>
            ) : (
              tracks.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-zinc-800/80 hover:bg-zinc-900/50"
                >
                  {/* TRACK */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-50">
                        {t.title || "(sin título)"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {t.artist || "(sin artista)"}
                      </span>
                      <span className="mt-1 text-[10px] font-mono text-zinc-500 break-words">
                        ID: {t.id}
                      </span>
                    </div>
                  </td>

                  {/* ESTADO */}
                  <td className="px-4 py-3 align-top">
                    <EstadoChip row={t} />
                  </td>

                  {/* ASSET */}
                  <td className="px-4 py-3 align-top">
                    <AssetInfo row={t} />
                  </td>

                  {/* AUDIO (LUFS/LRA/TP/DUR/SR) */}
                  <td className="px-4 py-3 align-top">
                    <AudioInfo row={t} />
                  </td>

                  {/* ANALIZADO / FECHA */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col text-xs text-zinc-400">
                      {t.analysisAt ? (
                        <>
                          <span className="text-emerald-400">
                            Analizado
                          </span>
                          <span>{formatDateTime(t.analysisAt)}</span>
                        </>
                      ) : (
                        <span className="text-amber-400">
                          Sin análisis
                          </span>
                      )}
                    </div>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-4 py-3 align-top">
                    <AnalyzeActions id={t.id} className="justify-end" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

/**
 * Chip de estado general del track:
 * - Sin audio (no hay assetKey ni audioUrl)
 * - Sin análisis (hay audio pero sin analysisAt)
 * - Analizado (audio presente y analysisAt definido)
 */
function EstadoChip({ row }: { row: AnalyzeRow }) {
  const hasAudio = !!(row.assetKey || row.audioUrl);
  const analyzed = !!row.analysisAt;

  const baseClass =
    "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-medium";

  if (!hasAudio) {
    return (
      <span
        className={
          baseClass +
          " border border-zinc-700 bg-zinc-900 text-zinc-300"
        }
      >
        Sin audio
      </span>
    );
  }

  if (!analyzed) {
    return (
      <span
        className={
          baseClass +
          " border border-amber-500/50 bg-amber-500/10 text-amber-300"
        }
      >
        Sin análisis
      </span>
    );
  }

  return (
    <span
      className={
        baseClass +
        " border border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
      }
    >
      Analizado
    </span>
  );
}

/**
 * Info de asset, columna estrecha:
 * - R2: etiqueta "R2" y un link corto "Abrir audio (R2)".                   │
 * - URL externa: link corto "Abrir audio externo".                          │
 * - Sin audio: texto neutro.                                                │
 */
function AssetInfo({ row }: { row: AnalyzeRow }) {
  // Caso 1: asset en R2 (preferente)
  if (row.assetKey) {
    const url = getS3PublicUrl(row.assetKey);

    return (
      <div className="flex flex-col text-[11px] space-y-1">
        <span className="text-emerald-400 font-medium">R2</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-zinc-200 underline underline-offset-2 hover:text-emerald-300"
        >
          Abrir audio (R2)
        </a>
      </div>
    );
  }

  // Caso 2: solo URL externa
  if (row.audioUrl) {
    return (
      <div className="flex flex-col text-[11px] space-y-1">
        <span className="text-sky-400 font-medium">URL externa</span>
        <a
          href={row.audioUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-zinc-200 underline underline-offset-2 hover:text-sky-300"
        >
          Abrir audio externo
        </a>
      </div>
    );
  }

  // Caso 3: sin audio
  return (
    <span className="text-xs text-zinc-500">
      Sin audio
    </span>
  );
}

/**
 * Columna consolidada de AUDIO:
 * - Línea 1: LUFS, LRA, TP (texto compacto, no “chips” grandes).
 * - Línea 2: Duración y Sample rate.
 * Diseñada para ser legible pero más aireada horizontalmente.
 */
function AudioInfo({ row }: { row: AnalyzeRow }) {
  const hasAnalysis =
    typeof row.loudnessLufs === "number" ||
    typeof row.loudnessRangeLu === "number" ||
    typeof row.truePeakDbfs === "number" ||
    typeof row.durationSec === "number" ||
    typeof row.sampleRateHz === "number";

  if (!hasAnalysis) {
    return (
      <span className="text-xs text-zinc-500">
        Sin análisis. Usa <span className="font-semibold">Analizar</span>.
      </span>
    );
  }

  const lufs =
    typeof row.loudnessLufs === "number"
      ? row.loudnessLufs.toFixed(2)
      : null;
  const lra =
    typeof row.loudnessRangeLu === "number"
      ? row.loudnessRangeLu.toFixed(2)
      : null;
  const tp =
    typeof row.truePeakDbfs === "number"
      ? row.truePeakDbfs.toFixed(2)
      : null;

  const dur =
    typeof row.durationSec === "number"
      ? `${Math.round(row.durationSec)} s`
      : null;
  const sr =
    typeof row.sampleRateHz === "number"
      ? `${row.sampleRateHz} Hz`
      : null;

  return (
    <div className="flex flex-col text-[11px] text-zinc-200 space-y-1">
      {/* Línea 1: LUFS / LRA / TP */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <span className="font-mono">
          LUFS: {lufs ?? "–"}
        </span>
        <span className="font-mono">
          LRA: {lra ?? "–"}
        </span>
        <span className="font-mono">
          TP: {tp ?? "–"}
        </span>
      </div>

      {/* Línea 2: Duración / Sample rate */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-zinc-300">
        <span>{dur ? `Dur: ${dur}` : "Dur: –"}</span>
        <span>{sr ? `SR: ${sr}` : "SR: –"}</span>
      </div>
    </div>
  );
}

function formatDateTime(d: Date) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}
