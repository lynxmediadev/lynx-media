/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/track/[id]/page.tsx                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Ficha pública del track con estética “cine”.                              │
 * │ - Waveform navegable (click = seek) y SIEMPRE visible si hay bytes en BD.   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { getS3PublicUrl } from "@/lib/storage/s3";
import LinkedWaveform from "@/components/audio/LinkedWaveform";

export const dynamic = "force-dynamic"; // evita que el payload se cachee

type PageProps =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

// Buffer/Uint8Array → base64 robusto (Node/Edge-safe)
function bytesToBase64(bytes: unknown): string | null {
  if (!bytes) return null;
  // Prisma Bytes viene como Buffer (Node) o Uint8Array
  try {
    const u8 =
      bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
    // Node:
    if (typeof Buffer !== "undefined") {
      return Buffer.from(u8).toString("base64");
    }
    // Edge fallback:
    let binary = "";
    for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]!);
    // @ts-expect-error atob/btoa en edge
    return btoa(binary);
  } catch {
    return null;
  }
}

export default async function PublicTrackPage({ params }: PageProps) {
  const { id } =
    "then" in (params as any)
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string });

  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      assetKey: true,
      durationSec: true,
      loudnessLufs: true,
      truePeakDbfs: true,
      waveform: true,
      updatedAt: true,
      // (si quieres mostrar más, añade aquí)
    },
  });
  if (!track) notFound();

  const src = track.audioUrl ?? (track.assetKey ? getS3PublicUrl(track.assetKey) : null);
  const waveformB64 = bytesToBase64(track.waveform);

  const audioId = "public-track-player";

  const fmt = {
    sec: (s: number | null | undefined) => (s == null ? "—" : `${s}s`),
    num: (v: number | null | undefined, d = 2) =>
      v == null || !isFinite(v as number) ? "—" : Number(v).toFixed(d),
  };

  return (
    <div className="min-h-dvh bg-[#0b0b0b] text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {track.title ?? "Untitled"}
          </h1>
          <p className="text-sm text-zinc-400">{track.artist ?? "Autor desconocido"}</p>
        </header>

        {/* Player */}
        <section className="mb-6">
          {src ? (
            <audio id={audioId} controls preload="metadata" className="w-full rounded-lg bg-white/5">
              <source src={src} />
              Tu navegador no soporta audio HTML5.
            </audio>
          ) : (
            <div className="rounded border border-white/10 p-4 text-sm text-zinc-400">
              Este track aún no tiene archivo de audio público disponible.
            </div>
          )}
        </section>

        {/* Waveform navegable */}
        <section className="mb-10 space-y-2">
          {waveformB64 ? (
            <>
              <LinkedWaveform
                base64={waveformB64}
                durationSec={track.durationSec}
                audioElementId={audioId}
                height={84}
              />
              <p className="text-xs text-zinc-500">
                Click en la forma de onda para moverte por la pieza.
              </p>
            </>
          ) : (
            <p className="text-xs text-zinc-500">Sin forma de onda disponible para este track.</p>
          )}
        </section>

        {/* Métricas rápidas */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-xs uppercase text-zinc-500">Duración</div>
            <div className="text-lg">{fmt.sec(track.durationSec)}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-xs uppercase text-zinc-500">LUFS (I)</div>
            <div className="text-lg">{fmt.num(track.loudnessLufs)}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-xs uppercase text-zinc-500">True Peak</div>
            <div className="text-lg">{fmt.num(track.truePeakDbfs)}</div>
          </div>
        </section>

        <div className="text-sm text-zinc-400">
          <Link href="/tracks" className="underline">
            ← Volver al catálogo
          </Link>
        </div>
      </main>
    </div>
  );
}
