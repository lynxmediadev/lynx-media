// src/app/admin/track/[id]/edit/page.tsx
/**
 * Editor unificado de track (admin)
 *
 * Ruta:
 *   - /admin/track/[id]/edit
 *
 * Unifica:
 *   • Audio & análisis técnico (player + métricas).
 *   • Metadata creativa (título, artista, moods, usos).
 *   • Identificadores (ISRC / ISWC / UPC).
 *   • Derechos & explotación (incluye Publishing split).
 *
 * Peras y manzanas:
 * - Es la “ficha completa” del track.
 * - Desde aquí puedes revisar casi todo lo relevante del track.
 * - Usa un único guardado para campos editables.
 */

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import prisma from "@/lib/prisma";
import PublicAudioBar from "@/components/public/PublicAudioBar";
import TrackEditForm from "@/components/admin/track/TrackEditForm";
import { getS3PublicUrl } from "@/lib/storage/s3";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { DeleteTrackButton } from "@/components/admin/track/DeleteTrackButton.client";
import { deleteObjectFromS3 } from "@/lib/storage/delete-object";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { getAudioCheckStatus } from "@/lib/audio/audio-check";

export const dynamic = "force-dynamic";

/** Convierte Buffer/Uint8Array → base64 para el waveform del player técnico */
function bytesToBase64(buf: Buffer | Uint8Array | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

export default async function AdminTrackEditPage({
  params,
}: {
  // Next 15 entrega params como Promise; lo declaramos así para cumplir PageProps
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const track = await prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      // Creativo
      title: true,
      artist: true,
      moods: true,
      uses: true,
      bpm: true,
      key: true,
      trackType: true,
      genres: true,
      subgenres: true,
      tags: {
        select: {
          tag: {
            select: { id: true, slug: true, name: true, type: true },
          },
        },
      },

      // Audio / asset
      audioUrl: true,
      coverUrl: true,
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
      waveform: true,
      analysisAt: true,

      // Identificadores
      isrc: true,
      iswc: true,
      upc: true,

      // Derechos
      master: true,
      licenseType: true,
      mediaBuy: true,
      mfn: true,
      oneStop: true,
      clearedForSync: true,
      exclusiveTerritories: true,
      exclusiveTermMonths: true,
      restrictedTerritories: true,
      restrictedIndustries: true,
      restrictedPlatforms: true,
      restrictedBrands: true,
      pricingTier: true,
      budgetMin: true,
      budgetMax: true,
      budgetCurrency: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
      restrictions: true,

      // Publishing (guardado como string o JSON, según schema)
      // publishingSplit: true,
      publishingShares: {
        select: {
          id: true,
          role: true,
          name: true,
          ipiNumber: true,
          pro: true,
          caeNumber: true,
          sharePct: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      masterShares: {
        select: {
          id: true,
          name: true,
          sharePct: true,
          contact: true,
          notes: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      versions: {
        select: {
          label: true,
          durationSec: true,
          kind: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      stems: {
        select: {
          name: true,
          group: true,
          durationSec: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!track) {
    notFound();
  }


  const publicSrc = track.assetKey
    ? getS3PublicUrl(track.assetKey)
    : (track.audioUrl ?? null);

  const waveformB64 = track.waveform
    ? bytesToBase64(track.waveform as any)
    : null;

  const audioCheck = await getAudioCheckStatus(track.audioUrl, {
    cacheKey: track.id,
  });

  const primaryWriter =
    track.publishingShares.find((s) => s.role === "WRITER") ?? null;

  // Asegura tags base de catálogo (beats/sync) para que siempre aparezcan
  await prisma.$transaction([
    prisma.tag.upsert({
      where: { slug: "beats" },
      update: { name: "BEATS", type: "CATALOG" },
      create: { slug: "beats", name: "BEATS", type: "CATALOG" },
    }),
    prisma.tag.upsert({
      where: { slug: "sync" },
      update: { name: "SYNC", type: "CATALOG" },
      create: { slug: "sync", name: "SYNC", type: "CATALOG" },
    }),
    prisma.tag.upsert({
      where: { slug: "games" },
      update: { name: "GAMES", type: "CATALOG" },
      create: { slug: "games", name: "GAMES", type: "CATALOG" },
    }),
  ]);

  const catalogTags = await prisma.tag.findMany({
    where: { type: "CATALOG" },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  /**
   * Server Action para eliminar track.
   *
   * Peras y manzanas:
   * - La invoca el <form action={deleteAction}> del DeleteTrackButton.
   * - Lee id/assetKey/coverUrl desde el FormData.
   * - Elimina el registro en BD.
   * - Intenta borrar el asset en R2 (si hay assetKey).
   * - Luego revalida y hace redirect a /admin/tracks.
   */
  async function deleteTrackAction(formData: FormData) {
    "use server";

    const idFromForm = formData.get("id");
    const assetKey = (formData.get("assetKey") as string | null) || null;
    const coverUrl = (formData.get("coverUrl") as string | null) || null;

    if (!idFromForm || typeof idFromForm !== "string") {
      console.error(
        "[track:edit:deleteTrackAction] id inválido en FormData",
        idFromForm,
      );
      return;
    }

    try {
      // 1) Eliminar de BD
      await prisma.track.delete({
        where: { id: idFromForm },
      });

      // 2) Intentar borrar asset en R2/S3 (no rompe si falla)
      const r2Result = await deleteObjectFromS3(assetKey);
      console.log("[track:edit:deleteTrackAction] deleteObjectFromS3", {
        assetKey,
        coverUrl,
        result: r2Result,
      });
    } catch (err) {
      console.error("[track:edit:deleteTrackAction] fatal:", err, {
        idFromForm,
        assetKey,
        coverUrl,
      });
      // Si algo falla aquí, no intentamos redirigir
      return;
    }

    // 3) Revalidar y REDIRIGIR (fuera del try/catch para no atrapar NEXT_REDIRECT)
    revalidatePath("/admin/tracks");
    redirect("/admin/tracks");
  }

  // Flag simple: ¿tenemos análisis técnico?
  const techHasAnalysis =
    track.loudnessLufs !== null ||
    track.loudnessRangeLu !== null ||
    track.truePeakDbfs !== null ||
    track.analysisAt !== null;

  return (
    <div className="space-y-4 min-h-screen pb-12">
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Editar track</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {track.title ?? "(sin título)"} —{" "}
            <span className="text-muted-foreground">
              {track.artist ?? "(sin artista)"}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            ID: <span className="font-mono">{track.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DeleteTrackButton
            trackId={track.id}
            trackTitle={track.title}
            deleteAction={deleteTrackAction}
            assetKey={track.assetKey}
            coverUrl={track.coverUrl}
          />
          <TrackAnalyzeHeaderButtons
            id={track.id}
            audioUrl={track.audioUrl}
            initialAudioStatus={audioCheck.status}
            initialAudioMessage={audioCheck.message}
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Link href="/admin/tracks">Volver al listado</Link>
          </Button>
        </div>
      </header>

      {/* SECCIONES PRINCIPALES */}
      <div className="space-y-4">
        {/* 1. Audio / análisis técnico — layout en filas */}
        <section className="space-y-4">
          {/* Izquierda: Player + ficha básica */}
          <div className="space-y-3 rounded-xl border border-border bg-card/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Audio &amp; análisis técnico
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Player con waveform y datos técnicos base del archivo
                  (duración, sample rate, canales, bitrate).
                </p>
              </div>
            </div>

            {publicSrc ? (
                  <PublicAudioBar
                    src={publicSrc}
                    waveformB64={waveformB64}
                    durationSec={track.durationSec ?? undefined}
                  />
            ) : (
              <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
                No hay audio asociado a este track. Sube un archivo desde la
                sección de creación o análisis.
              </p>
            )}

            {/* Ficha técnica básica del archivo */}
            <div className="grid gap-2 rounded-lg border border-border bg-card/90 p-3 text-xs text-foreground md:grid-cols-4">
              <div className="rounded-md border border-border bg-muted/60 p-2">
                <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  ISRC
                </div>
                <div className="">
                  {(track.isrc ?? "—").trim().toUpperCase()}
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/60 p-2">
                <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  ISWC
                </div>
                <div className="">
                  {(track.iswc ?? "—").trim().toUpperCase()}
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/60 p-2">
                <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  TIPO DE LICENCIA
                </div>
                <div className="">
                  {(track.licenseType ?? "—").trim().toUpperCase()}
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/60 p-2">
                <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  COMPOSITOR
                </div>
                <div className="">
                  {(primaryWriter?.name ?? "—").trim().toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Derecha: Resumen técnico (LUFS, LRA, True Peak) */}
          <div className="space-y-3 rounded-xl border border-border bg-card/80 p-4 text-xs text-foreground/80">
            <h2 className="text-sm font-semibold text-foreground">
              Resumen técnico
            </h2>

            {techHasAnalysis ? (
              <dl className="grid grid-cols-2 gap-2 md:grid-cols-3">
                <div>
                  <dt className="text-[11px] font-black text-muted-foreground">
                    Loudness (I)
                  </dt>
                  <dd className="font-mono text-xs">
                    {typeof track.loudnessLufs === "number"
                      ? `${track.loudnessLufs.toFixed(2)} LUFS`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-black text-muted-foreground">
                    Loudness Range
                  </dt>
                  <dd className="font-mono text-xs">
                    {typeof track.loudnessRangeLu === "number"
                      ? `${track.loudnessRangeLu.toFixed(2)} LU`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-black text-muted-foreground">
                    True Peak
                  </dt>
                  <dd className="font-mono text-xs">
                    {typeof track.truePeakDbfs === "number"
                      ? `${track.truePeakDbfs.toFixed(2)} dBFS`
                      : "–"}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-black text-muted-foreground">
                    Duración
                  </dt>
                  <dd className="font-mono text-xs">
                    {typeof track.durationSec === "number"
                      ? `${track.durationSec.toFixed(2)} s`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-black text-muted-foreground">
                    Sample Rate
                  </dt>
                  <dd className="font-mono text-xs">
                    {typeof track.sampleRateHz === "number"
                      ? `${track.sampleRateHz.toFixed(2)} Hz`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-black text-muted-foreground">
                    Bitrate
                  </dt>
                  <dd className="font-mono text-xs">
                    {typeof track.bitrateKbps === "number"
                      ? `${track.bitrateKbps.toFixed(2)} kbps`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-black text-muted-foreground">
                    Último análisis
                  </dt>
                  <dd className="font-mono text-[11px]">
                    {track.analysisAt
                      ? new Date(track.analysisAt).toLocaleString()
                      : "–"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Aún no se ha realizado análisis técnico para este track. Usa el
                botón{" "}
                <span className="font-semibold text-foreground">“Analizar”</span>{" "}
                en el header superior para generar métricas de loudness (LUFS),
                rango (LRA) y True Peak.
              </p>
            )}

            <div className="pt-1 text-[11px]">
              <div className="text-[11px] font-black text-muted-foreground">
                Asset
              </div>
              {track.assetKey || track.audioUrl ? (
                <div className="flex flex-col gap-1">
                  <a
                    href={publicSrc ?? "#"}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-[11px] text-success underline underline-offset-2"
                  >
                    Abrir audio
                  </a>
                  <span className="text-muted-foreground">
                    {track.assetKey ? "R2" : "URL externa"} ·{" "}
                    {track.assetMime ?? "mime —"} ·{" "}
                    {track.assetSize != null
                      ? formatBytes(track.assetSize)
                      : "size —"}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Sin audio</span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              El detalle completo del análisis se muestra en este panel tras
              ejecutar “Analizar”.
            </p>
          </div>
        </section>

        <TrackEditForm
          track={{
            id: track.id,
            title: track.title,
            artist: track.artist,
            moods: track.moods,
            uses: track.uses,
            isrc: track.isrc,
            iswc: track.iswc,
            upc: track.upc,
            licenseType: track.licenseType,
            mediaBuy: track.mediaBuy,
            bpm: track.bpm,
            key: track.key,
            trackType: track.trackType,
            genres: track.genres,
            subgenres: track.subgenres,
            exclusiveTerritories: track.exclusiveTerritories,
            exclusiveTermMonths: track.exclusiveTermMonths,
            restrictedTerritories: track.restrictedTerritories,
            restrictedIndustries: track.restrictedIndustries,
            restrictedPlatforms: track.restrictedPlatforms,
            restrictedBrands: track.restrictedBrands,
            restrictions: track.restrictions ?? [],
            pricingTier: track.pricingTier,
            budgetMin: track.budgetMin,
            budgetMax: track.budgetMax,
            budgetCurrency: track.budgetCurrency,
            mfn: !!track.mfn,
            oneStop: !!track.oneStop,
            clearedForSync: !!track.clearedForSync,
            contentIdEnrolled: !!track.contentIdEnrolled,
            contentIdAdmin: track.contentIdAdmin,
            contentIdWhitelist: track.contentIdWhitelist,
            master: track.master,
            masterShares: track.masterShares,
            publishingShares: track.publishingShares,
            versions: track.versions,
            stems: track.stems,
            catalogTags: track.tags.map((t) => t.tag.slug),
          }}
          catalogTagOptions={catalogTags}
        />
      </div>
    </div>
  );
}
