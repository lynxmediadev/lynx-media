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

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";

import prisma from "@/lib/prisma";
import TrackEditForm from "@/components/admin/track/TrackEditForm";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { DeleteTrackButton } from "@/components/admin/track/DeleteTrackButton.client";
import { deleteObjectFromS3 } from "@/lib/storage/delete-object";
import { Button } from "@/components/ui/button";
import AudioAnalysisSection from "@/components/admin/track/AudioAnalysisSection";
import {
  getCatalogTagOptions,
  getMoodTagOptions,
  getTrackAudioHeaderModule,
  getTrackDeliverablesModule,
  getTrackEditCore,
  getTrackRightsModule,
  getUseTagOptions,
} from "@/server/track-edit/queries";

/**
 * FUNCION PRINCIPAL DE PAGINA: AdminTrackEditPage
 * Que hace:
 * - Carga todos los datos del track para la ruta /admin/track/[id]/edit.
 * - Prepara datos por modulo para el formulario de edicion.
 *
 * Input:
 * - params: Promise<{ id: string }>
 *
 * Output:
 * - JSX de la pagina de edicion completa del track.
 */
export default async function AdminTrackEditPage({
  params,
}: {
  // Next 15 entrega params como Promise; lo declaramos así para cumplir PageProps
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trackCore = await getTrackEditCore(id);
  if (!trackCore) {
    notFound();
  }
  const [trackAudioHeader, trackRights, trackDeliverables, catalogTags, moodTags, useTags] = await Promise.all([
    getTrackAudioHeaderModule(id),
    getTrackRightsModule(id),
    getTrackDeliverablesModule(id),
    getCatalogTagOptions(),
    getMoodTagOptions(),
    getUseTagOptions(),
  ]);
  if (!trackAudioHeader || !trackRights || !trackDeliverables) {
    notFound();
  }

  // MODULO DE WRITERS/PUBLISHERS
  // Toma el WRITER principal para mostrarlo en resumen tecnico.
  const primaryWriter =
    trackRights.publishingShares.find((s) => s.role === "WRITER") ?? null;

  // MODULO DE CATEGORIAS
  // Lista de CATEGORIAS asignadas al track actual.
  const assignedCategories =
    trackCore.tags
      ?.filter((t) => t.tag.type === "CATALOG")
      .map((c) => ({ id: c.tag.id, slug: c.tag.slug, name: c.tag.name })) ?? [];

  // MODULO DE MOODS
  // Lista de MOODS asignados al track actual.
  const assignedMoods =
    trackCore.tags?.filter((t) => t.tag.type === "MOOD").map((c) => c.tag.name) ?? [];

  // MODULO DE USES
  // Lista de USES asignados al track actual.
  const assignedUses =
    trackCore.tags?.filter((t) => t.tag.type === "USE").map((c) => c.tag.name) ?? [];

  /**
   * FUNCION SERVER ACTION: deleteTrackAction
   * Que hace:
   * - Elimina un track de BD.
   * - Intenta eliminar su asset en almacenamiento.
   * - Revalida y redirige al listado.
   *
   * Input:
   * - formData con: id, assetKey, coverUrl
   *
   * Output:
   * - No retorna datos de negocio (void).
   * - Efecto final: redirect a /admin/tracks cuando elimina correctamente.
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

  return (
    <div className="space-y-4 min-h-screen pb-12">
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Editar track</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {trackCore.title ?? "(sin título)"} —{" "}
            <span className="text-muted-foreground">
              {trackCore.artist ?? "(sin artista)"}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            ID: <span className="font-mono">{trackCore.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DeleteTrackButton
            trackId={trackCore.id}
            trackTitle={trackCore.title}
            deleteAction={deleteTrackAction}
            assetKey={trackAudioHeader.assetKey}
            coverUrl={trackAudioHeader.coverUrl}
          />
          <TrackAnalyzeHeaderButtons
            id={trackCore.id}
            audioUrl={trackAudioHeader.audioUrl}
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
        {/* 1. Audio / analisis tecnico (carga diferida) */}
        <Suspense
          fallback={
            <section className="space-y-3 rounded-xl border border-border bg-card/80 p-4">
              <div className="h-5 w-56 animate-pulse rounded bg-muted/40" />
              <div className="h-24 animate-pulse rounded bg-muted/30" />
              <div className="h-24 animate-pulse rounded bg-muted/30" />
            </section>
          }
        >
          <AudioAnalysisSection
            trackId={trackCore.id}
            isrc={trackCore.isrc}
            iswc={trackCore.iswc}
            licenseType={trackCore.licenseType}
            composerName={primaryWriter?.name ?? null}
          />
        </Suspense>

        {/* ORQUESTADOR DE MODULOS DEL FORMULARIO DE EDICION */}
        <TrackEditForm
          track={{
            id: trackCore.id,
            title: trackCore.title,
            artist: trackCore.artist,
            // MODULO DE MOODS: lista de MOODS asignados.
            assignedMoods: assignedMoods,
            // MODULO DE USES: lista de USES asignados.
            assignedUses: assignedUses,
            // MODULO DE CATEGORIAS: slugs asignados en TrackTag.
            catalogTags: trackCore.tags.map((t) => t.tag.slug),
            assignedCategories: assignedCategories,
            isrc: trackCore.isrc,
            iswc: trackCore.iswc,
            upc: trackCore.upc,
            licenseType: trackCore.licenseType,
            mediaBuy: trackCore.mediaBuy,
            bpm: trackCore.bpm,
            key: trackCore.key,
            trackType: trackCore.trackType,
            genres: trackCore.genres,
            subgenres: trackCore.subgenres,
            exclusiveTerritories: trackCore.exclusiveTerritories,
            exclusiveTermMonths: trackCore.exclusiveTermMonths,
            restrictedTerritories: trackCore.restrictedTerritories,
            restrictedIndustries: trackCore.restrictedIndustries,
            restrictedPlatforms: trackCore.restrictedPlatforms,
            restrictedBrands: trackCore.restrictedBrands,
            restrictions: trackCore.restrictions ?? [],
            pricingTier: trackCore.pricingTier,
            budgetMin: trackCore.budgetMin,
            budgetMax: trackCore.budgetMax,
            budgetCurrency: trackCore.budgetCurrency,
            mfn: !!trackCore.mfn,
            oneStop: !!trackCore.oneStop,
            clearedForSync: !!trackCore.clearedForSync,
            contentIdEnrolled: !!trackCore.contentIdEnrolled,
            contentIdAdmin: trackCore.contentIdAdmin,
            contentIdWhitelist: trackCore.contentIdWhitelist,
            // MODULO DE MASTER
            // Lista de MASTERS (masterShares) para edicion de porcentajes/contacto.
            master: trackRights.master,
            masterShares: trackRights.masterShares,
            // MODULO DE WRITERS/PUBLISHERS
            // Lista de WRITERS/PUBLISHERS (publishingShares) para split publishing.
            publishingShares: trackRights.publishingShares,
            versions: trackDeliverables.versions,
            stems: trackDeliverables.stems,
          }}
          catalogTagOptions={catalogTags}
          moodTagOptions={moodTags}
          useTagOptions={useTags}
        />
      </div>
    </div>
  );
}
