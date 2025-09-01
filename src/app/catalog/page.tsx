/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/catalog/page.tsx                                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Catálogo público con tarjetas elegantes, cada una con:                    │
 * │   título/autor, chips (moods/uses/restricciones) y mini-player (play + onda)│
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Server Component: consulta Prisma y arma una grilla.                      │
 * │ - Convierte Bytes (Prisma) → base64 para el Client Component de la onda.    │
 * │ - Misma estética “cine/minimal” que tu ficha pública.                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import Link from "next/link";
import { db } from "@/server/db";
import TrackCardWavePlayer from "@/components/public/TrackCardWavePlayer";
import { Buffer } from "buffer"; // asegura Buffer en RSC

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const tracks = await db.track.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      durationSec: true,
      moods: true,
      uses: true,
      restrictions: true,
      waveform: true,       // Bytes -> base64
      loudnessLufs: true,
      truePeakDbfs: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Catálogo</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Música y diseño sonoro para audiovisual — estética sobria, info clara.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t) => {
          const waveformB64 =
            t.waveform && (t.waveform as unknown as Uint8Array).length > 0
              ? Buffer.from(t.waveform as unknown as Uint8Array).toString("base64")
              : null;

          return (
            <article
              key={t.id}
              className="group flex flex-col rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700"
            >
              {/* Cabecera */}
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="flex-1 truncate text-base font-semibold text-zinc-100">
                  {t.title ?? "Untitled"}
                </h2>
                <span className="shrink-0 text-xs text-zinc-500">
                  {t.durationSec ? formatDuration(t.durationSec) : "—"}
                </span>
              </div>
              <div className="mb-3 truncate text-sm text-zinc-400">
                {t.artist ?? "—"}
              </div>

              {/* Mini-player (play + onda pro + click-to-seek/auto-play) */}
              <TrackCardWavePlayer
                src={t.audioUrl ?? null}
                waveformB64={waveformB64}
                durationSec={t.durationSec ?? 0}
                className="mb-4"
                height={64}
              />

              {/* Chips (moods/uses/restricciones) */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {t.moods?.map((m, i) => (
                  <Chip key={`m-${t.id}-${i}`}>{m}</Chip>
                ))}
                {t.uses?.map((u, i) => (
                  <Chip key={`u-${t.id}-${i}`} tone="blue">
                    {u}
                  </Chip>
                ))}
                {t.restrictions?.map((r, i) => (
                  <Chip key={`r-${t.id}-${i}`} tone="rose">
                    {r}
                  </Chip>
                ))}
              </div>

              {/* CTA a la ficha */}
              <div className="mt-auto flex items-center justify-between">
                <Link
                  href={`/track/${t.id}`}
                  className="rounded-lg border border-zinc-700/70 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800/60"
                >
                  Ver ficha →
                </Link>
                {(isFiniteNum(t.loudnessLufs) || isFiniteNum(t.truePeakDbfs)) && (
                  <div className="text-[11px] text-zinc-500">
                    {isFiniteNum(t.loudnessLufs) && (
                      <span className="mr-2">LUFS {t.loudnessLufs!.toFixed(1)}</span>
                    )}
                    {isFiniteNum(t.truePeakDbfs) && (
                      <span>TP {t.truePeakDbfs!.toFixed(2)} dBFS</span>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {tracks.length === 0 && (
        <p className="mt-20 text-center text-sm text-zinc-500">
          Aún no hay piezas en catálogo.
        </p>
      )}
    </div>
  );
}

/* ——————————————————————— helpers UI ——————————————————————— */

function Chip({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "zinc" | "blue" | "rose";
}) {
  const map = {
    zinc: "bg-zinc-800/60 text-zinc-200 ring-1 ring-zinc-700",
    blue: "bg-blue-900/30 text-blue-200 ring-1 ring-blue-800/60",
    rose: "bg-rose-900/30 text-rose-200 ring-1 ring-rose-800/60",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${map[tone]}`}>
      {children}
    </span>
  );
}

function isFiniteNum(v: number | null | undefined): v is number {
  return typeof v === "number" && isFinite(v);
}

function formatDuration(sec: number) {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
