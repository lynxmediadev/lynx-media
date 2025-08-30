/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/app/admin/track/[id]/tech/page.tsx                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Página "Ficha técnica" por track: waveform + badges + metadatos + asset.  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Server Component (no hooks aquí).                                         │
 * │ - En Next 15, `params` puede ser Promise: se usa `await params`.            │
 * │ - Decodifica waveform Bytes (Prisma) → base64 para el <Sparkline/> cliente. │
 * │ - Integra **CopyButton** y **formatBytes** en el bloque Asset.              │
 * │ - FIX: el import correcto del `db` es `@/server/db` (no `@/src/server/db`). │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { db } from "@/server/db"; // ✅ FIX de alias
import Sparkline from "@/components/audio/Sparkline";
import QualityBadges from "@/components/audio/QualityBadges";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import CopyButton from "@/components/ui/CopyButton";
import { formatBytes, formatIso } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

export const dynamic = "force-dynamic"; // SSR cada vez (para ver refrescos de análisis)

// Helper: inferir fuente de LUFS a partir de low/high (si ambos 0 o null → loudnorm)
function inferLufsSource(lraLow: number | null, lraHigh: number | null) {
  const bothZero = lraLow === 0 && lraHigh === 0;
  const bothNull = lraLow == null && lraHigh == null;
  if (bothNull || bothZero) return "loudnorm" as const;
  return "ebur128" as const;
}

export default async function TechPage({ params }: Props) {
  // Next 15: params puede ser Promise o sync; manejamos ambos
  const { id } = "then" in (params as any) ? await (params as Promise<{ id: string }>) : (params as { id: string });

  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      assetKey: true,
      assetMime: true,
      assetSize: true,
      durationSec: true,
      sampleRateHz: true,
      channels: true,
      bitrateKbps: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      lraLowLufs: true,
      lraHighLufs: true,
      truePeakDbfs: true,
      waveform: true, // Bytes (Buffer)
      analysisAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!track) return notFound();

  // Waveform Bytes → base64 para pasarlo al componente cliente (Sparkline)
  const waveformB64 =
    track.waveform && (track.waveform as unknown as Buffer).length > 0
      ? Buffer.from(track.waveform as unknown as Buffer).toString("base64")
      : null;

  const lufsSource = inferLufsSource(track.lraLowLufs, track.lraHighLufs);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Ficha técnica · Track</h1>
        <p className="text-sm text-gray-500">ID: {track.id}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-base font-medium">
          {track.title ?? "Sin título"} <span className="text-gray-400">·</span> {track.artist ?? "Sin artista"}
        </div>
        <div className="flex items-center gap-2">
          <AnalyzeActions id={track.id} />
          <Link href="/admin/analyze" className="text-sm text-indigo-600 hover:underline">
            ← Volver a Admin · Analizar / Normalizar
          </Link>
        </div>
      </div>

      {/* Waveform */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Waveform</h2>
        <Sparkline base64={waveformB64} height={72} className="rounded-md" durationSec={track.durationSec} />
        <p className="text-xs text-gray-500">
          El waveform se guarda como <strong>Float32 → Bytes</strong> en DB y se decodifica en el cliente para dibujar
          el sparkline. Si re-analizas el track, verás la forma actualizada.
        </p>
      </section>

      {/* Calidad de audio */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Calidad de audio</h2>
        <QualityBadges
          lufs={track.loudnessLufs}
          lra={track.loudnessRangeLu}
          tp={track.truePeakDbfs}
          lraLow={track.lraLowLufs}
          lraHigh={track.lraHighLufs}
          lufsSource={lufsSource}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat label="LUFS (I)" value={fmt(track.loudnessLufs)} />
          <Stat label="LRA (LU)" value={fmt(track.loudnessRangeLu)} />
          <Stat label="True Peak (dBFS)" value={fmt(track.truePeakDbfs)} />
          <Stat label="LRA low / high" value={`${fmt(track.lraLowLufs)} / ${fmt(track.lraHighLufs)}`} />
          <Stat label="Último análisis" value={track.analysisAt ? formatIso(track.analysisAt.toISOString()) : "—"} />
        </div>

        <p className="text-xs text-gray-500">
          Reglas guía: objetivo streaming ~ <strong>-14 LUFS</strong>; True Peak recomendado ≤ <strong>-1.0 dBFS</strong
          >. Cuando la fuente sea <code>loudnorm</code>, LRA low/high se mostrarán como “0 / 0”.
        </p>
      </section>

      {/* Metadatos técnicos */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Metadatos técnicos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat label="Duración" value={track.durationSec != null ? `${track.durationSec}s` : "—"} />
          <Stat label="Sample Rate" value={track.sampleRateHz != null ? `${track.sampleRateHz} Hz` : "—"} />
          <Stat label="Canales" value={track.channels ?? "—"} />
          <Stat label="Bitrate" value={track.bitrateKbps != null ? `${track.bitrateKbps} kbps` : "—"} />
        </div>
      </section>

      {/* Asset (R2) – D2-C */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Asset (R2)</h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-sm">
          <div className="md:col-span-2 text-gray-500">assetKey</div>
          <div className="md:col-span-8 font-mono break-all">{track.assetKey ?? "—"}</div>
          <div className="md:col-span-2">
            {track.assetKey ? <CopyButton text={track.assetKey} label="Copiar key" size="sm" /> : null}
          </div>

          <div className="md:col-span-2 text-gray-500">audioUrl</div>
          <div className="md:col-span-8 font-mono break-all">
            {track.audioUrl ? (
              <a href={track.audioUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                {track.audioUrl}
              </a>
            ) : (
              "—"
            )}
          </div>
          <div className="md:col-span-2">
            {track.audioUrl ? <CopyButton text={track.audioUrl} label="Copiar URL" size="sm" /> : null}
          </div>

          <div className="md:col-span-2 text-gray-500">MIME</div>
          <div className="md:col-span-10">{track.assetMime ?? "—"}</div>

          <div className="md:col-span-2 text-gray-500">Tamaño</div>
          <div className="md:col-span-10">
            {track.assetSize != null ? (
              <>
                {formatBytes(track.assetSize)}{" "}
                <span className="text-gray-400">({track.assetSize} bytes)</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          La normalización de asset usa <strong>HEAD/Range</strong> y la convención{" "}
          <code>audio/YYYY/MM/DD/uuid-slug-vN.ext</code>.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-gray-200 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function fmt(v: number | null) {
  return v == null || !isFinite(v) ? "—" : Number(v).toFixed(2);
}
