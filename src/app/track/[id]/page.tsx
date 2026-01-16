/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/track/[id]/page.tsx                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Ficha pública del track con estética mínima/cinematográfica y tokens      │
 * │   globales (bg-background/card/border, radios 2px).                         │
 * │ - Server Component prepara datos y entrega waveform/base64 + URLs públicas. │
 * │ - PublicAudioBar usa el waveform Artlist-style y soporta click-to-seek.     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { getS3PublicUrl } from "@/lib/storage/s3";
import TrackMetadataTable from "@/components/public/TrackMetadataTable";
import TrackHero from "./TrackHero";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

/** Buffer(Bytes) → base64 para entregar al canvas del cliente */
function bytesToBase64(buf: Buffer | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

/** Prefiere assetKey→R2; si no, usa audioUrl como fallback */
function publicAudioUrl(input: {
  assetKey: string | null;
  audioUrl: string | null;
}): string | null {
  if (input.assetKey) return getS3PublicUrl(input.assetKey);
  return input.audioUrl ?? null;
}

/** mm:ss para duración */
function fmtDuration(sec: number | null | undefined): string {
  if (sec == null || !isFinite(sec)) return "—";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function formatUpdated(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Pill visual para moods/uses/restrictions */
function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[2px] border border-border bg-background/80 px-2 py-1 text-[11px] leading-tight text-foreground">
      {children}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2px] border border-border bg-card/80 p-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default async function TrackPublicPage({ params }: PageProps) {
  // ✅ Next 15: `params` puede venir como Promise → lo resolvemos.
  const { id } =
    "then" in (params as any)
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string });

  // 1) Datos del track (pública + ficha técnica)
  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      coverUrl: true,
      durationSec: true,
      assetKey: true,
      audioUrl: true,
      waveform: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      truePeakDbfs: true,
      moods: true,
      uses: true,
      restrictions: true,
      sampleRateHz: true,
      channels: true,
      bitrateKbps: true,
      licenseType: true,
      territories: true,
      term: true,
      master: true,
      mfn: true,
      contentIdEnrolled: true,
      contentIdWhitelist: true,
      contentIdAdmin: true,
      isrc: true,
      iswc: true,
      upc: true,
      publishingSplit: true,
      updatedAt: true,
    },
  });
  if (!track) notFound();

  // 2) Preparar src público + waveform en base64 para el canvas
  const src = publicAudioUrl({
    assetKey: track.assetKey,
    audioUrl: track.audioUrl,
  });
  const waveformB64 = bytesToBase64(track.waveform as unknown as Buffer | null);

  // 3) Similar por primer mood; si no hay, recientes
  let similar = await db.track.findMany({
    where: track.moods?.length
      ? { id: { not: track.id }, moods: { hasSome: [track.moods[0]!] } }
      : { id: { not: track.id } },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      artist: true,
      loudnessLufs: true,
      durationSec: true,
    },
  });
  if (!similar.length) {
    similar = await db.track.findMany({
      where: { id: { not: track.id } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        artist: true,
        loudnessLufs: true,
        durationSec: true,
      },
    });
  }

  const licenseUses =
    track.uses && track.uses.length
      ? track.uses
      : ["Uso comercial audiovisual (d)", "Social ads / paid media (d)"];
  const licenseRestrictions =
    track.restrictions && track.restrictions.length
      ? track.restrictions
      : ["No uso político (d)", "No gambling (d)"];

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-10">
        {/* Header minimal */}
        <header className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
          >
            ← Catálogo
          </Link>
          <span aria-label="Última actualización">{formatUpdated(track.updatedAt)}</span>
        </header>

        <TrackHero track={track} coverUrl={track.coverUrl} audioSrc={src} waveformB64={waveformB64} />

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <section className="space-y-4">
            <div className="rounded-[2px] border border-border bg-card p-4 shadow-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                <MetricCard label="Duración" value={fmtDuration(track.durationSec)} />
                <MetricCard
                  label="LUFS (I)"
                  value={
                    track.loudnessLufs == null ? "—" : track.loudnessLufs.toFixed(2)
                  }
                />
                <MetricCard
                  label="True Peak"
                  value={
                    track.truePeakDbfs == null
                      ? "—"
                      : `${track.truePeakDbfs.toFixed(2)} dBFS`
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                <div>
                  <h2 className="text-sm font-semibold leading-tight">Moods</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(track.moods ?? []).length ? (
                      track.moods!.map((m, i) => <Pill key={i}>{m}</Pill>)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-tight">Usos sugeridos</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(track.uses ?? []).length ? (
                      track.uses!.map((u, i) => <Pill key={i}>{u}</Pill>)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <h2 className="text-sm font-semibold leading-tight">Restricciones</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(track.restrictions ?? []).length ? (
                      track.restrictions!.map((r, i) => <Pill key={i}>{r}</Pill>)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                <div className="rounded-[2px] border border-border/70 bg-background/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Usos permitidos
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {licenseUses.map((u, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-foreground/70" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[2px] border border-border/70 bg-background/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Restricciones
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {licenseRestrictions.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-foreground/70" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <TrackMetadataTable track={track} />
          </section>
        </div>

        <section className="rounded-[2px] border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium leading-tight">Piezas similares</h2>
            <span className="text-xs text-muted-foreground">
              {track.moods?.length ? `Mood · ${track.moods[0]}` : "Recientes"}
            </span>
          </div>
          {similar.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay sugerencias por ahora.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {similar.map((s) => (
                <li key={s.id} className="py-2">
                  <Link
                    href={`/track/${s.id}`}
                    className="flex items-center justify-between gap-4 rounded-[2px] px-2 py-2 transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {s.title ?? "Sin título"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {s.artist ?? "Artista desconocido"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{fmtDuration(s.durationSec ?? 0)}</span>
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                      <span>
                        {s.loudnessLufs == null
                          ? "—"
                          : `${s.loudnessLufs.toFixed(1)} LUFS`}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
