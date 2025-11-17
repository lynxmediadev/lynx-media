// src/components/admin/track/TrackAudioTechSection.tsx
/**
 * TrackAudioTechSection
 *
 * Objetivo:
 * - Renderizar la sección de “Audio & análisis técnico” del panel admin.
 * - Incluye: player con waveform + ficha técnica del archivo + resumen de métricas (LUFS, LRA, True Peak, último análisis).
 *
 * Peras y manzanas:
 * - Es un bloque reutilizable para vistas de administración de un track.
 * - Recibe todos los datos ya calculados desde el servidor (no hace fetch, no toca Prisma).
 * - Solo se encarga de presentar la información con el layout de 2 columnas.
 *
 * Notas:
 * - Diseñado para usarse en /admin/track/[id]/edit y potencialmente en otras fichas técnicas.
 * - No maneja acciones (“Analizar”, “Eliminar”, etc.), eso se deja al contenedor.
 */

import Link from "next/link";

import PublicAudioBar from "@/components/public/PublicAudioBar";

type TrackAudioTechSectionProps = {
  // Identificador solo para construir el link a la ficha técnica
  trackId: string;

  // Datos creativos básicos
  title: string | null;
  artist: string | null;

  // Audio / asset
  publicSrc: string | null;
  waveformB64: string | null;
  durationSec: number | null;
  sampleRateHz: number | null;
  channels: number | null;
  bitrateKbps: number | null;

  // Métricas técnicas
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
  analysisAt: Date | string | null;
};

export function TrackAudioTechSection(props: TrackAudioTechSectionProps) {
  const {
    trackId,
    title,
    artist,
    publicSrc,
    waveformB64,
    durationSec,
    sampleRateHz,
    channels,
    bitrateKbps,
    loudnessLufs,
    loudnessRangeLu,
    truePeakDbfs,
    analysisAt,
  } = props;

  const analysisDate = analysisAt ? new Date(analysisAt) : null;

  const techHasAnalysis =
    loudnessLufs !== null ||
    loudnessRangeLu !== null ||
    truePeakDbfs !== null ||
    analysisAt !== null;

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
      {/* [LYNX-SECTION:track-audio-tech-left-panel] START */}
      {/* Izquierda: Player + ficha básica */}
      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-50">
              Audio &amp; análisis técnico
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Player con waveform y datos técnicos base del archivo (duración,
              sample rate, canales, bitrate).
            </p>
          </div>
        </div>

        {publicSrc ? (
          <PublicAudioBar
            src={publicSrc}
            waveformB64={waveformB64 ?? undefined}
            title={title ?? "(sin título)"}
            artist={artist ?? "(sin artista)"}
            durationSec={
              typeof durationSec === "number" ? durationSec : undefined
            }
            sampleRateHz={
              typeof sampleRateHz === "number" ? sampleRateHz : undefined
            }
            channels={typeof channels === "number" ? channels : undefined}
            bitrateKbps={
              typeof bitrateKbps === "number" ? bitrateKbps : undefined
            }
            dense
          />
        ) : (
          <p className="rounded-md border border-amber-500/40 bg-amber-900/10 p-2 text-xs text-amber-200">
            No hay audio asociado a este track. Sube un archivo desde la sección
            de creación o análisis.
          </p>
        )}

        {/* Ficha técnica básica del archivo */}
        <div className="grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-zinc-200 md:grid-cols-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              Duración
            </div>
            <div>
              {typeof durationSec === "number"
                ? `${durationSec.toFixed(2)} s`
                : "–"}
            </div>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              Sample Rate
            </div>
            <div>
              {typeof sampleRateHz === "number"
                ? `${sampleRateHz} Hz`
                : "–"}
            </div>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              Canales
            </div>
            <div>{channels ?? "–"}</div>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              Bitrate
            </div>
            <div>
              {typeof bitrateKbps === "number"
                ? `${bitrateKbps} kbps`
                : "–"}
            </div>
          </div>
        </div>
      </div>
      {/* [LYNX-SECTION:track-audio-tech-left-panel] END */}

      {/* [LYNX-SECTION:track-audio-tech-summary-panel] START */}
      {/* Derecha: Resumen técnico (LUFS, LRA, True Peak) */}
      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-300">
        <h2 className="text-sm font-semibold text-zinc-50">Resumen técnico</h2>

        {techHasAnalysis ? (
          <dl className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-[11px] text-zinc-500">Loudness (I)</dt>
              <dd className="font-mono text-xs">
                {typeof loudnessLufs === "number"
                  ? `${loudnessLufs.toFixed(2)} LUFS`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-zinc-500">Loudness Range</dt>
              <dd className="font-mono text-xs">
                {typeof loudnessRangeLu === "number"
                  ? `${loudnessRangeLu.toFixed(2)} LU`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-zinc-500">True Peak</dt>
              <dd className="font-mono text-xs">
                {typeof truePeakDbfs === "number"
                  ? `${truePeakDbfs.toFixed(2)} dBFS`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-zinc-500">Último análisis</dt>
              <dd className="font-mono text-[11px]">
                {analysisDate ? analysisDate.toLocaleString() : "–"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-[11px] text-zinc-400">
            Aún no se ha realizado análisis técnico para este track. Usa el
            botón{" "}
            <span className="font-semibold text-zinc-200">“Analizar”</span> en
            el header superior para generar métricas de loudness (LUFS), rango
            (LRA) y True Peak.
          </p>
        )}

        <p className="text-[11px] text-zinc-500">
          Para ver el detalle completo del análisis (histograma de loudness,
          métricas avanzadas, etc.), ve a{" "}
          <Link
            href={`/admin/track/${trackId}/tech`}
            className="text-emerald-400 underline underline-offset-2"
          >
            ficha técnica
          </Link>
          .
        </p>
      </div>
      {/* [LYNX-SECTION:track-audio-tech-summary-panel] END */}
    </section>
  );
}
