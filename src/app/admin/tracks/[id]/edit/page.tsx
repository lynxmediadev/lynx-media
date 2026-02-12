// src/app/admin/tracks/[id]/edit/page.tsx
/**
 * Editor modular de track (admin) - Overview
 *
 * Ruta:
 *   - /admin/tracks/[id]/edit
 *
 * Esta vista es el panel de control del editor modular.
 * Cada modulo se edita en su subruta y existe una vista completa temporal en /full.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { DeleteTrackButton } from "@/components/admin/track/DeleteTrackButton.client";
import { deleteObjectFromS3 } from "@/lib/storage/delete-object";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import {
  getTrackEditCore,
  getTrackAudioHeaderModule,
  getTrackRightsModule,
  getTrackDeliverablesModule,
} from "@/server/track-edit/queries";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";

type ModuleStatus = "ok" | "warning" | "info";

function StatusChip({ status, text }: { status: ModuleStatus; text: string }) {
  const style =
    status === "ok"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
      : status === "warning"
        ? "border-amber-500/35 bg-amber-500/10 text-amber-300"
        : "border-border bg-muted/30 text-muted-foreground";

  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-medium ${style}`}
    >
      {text}
    </span>
  );
}

function ModuleCard({
  title,
  description,
  href,
  status,
  statusText,
  details,
}: {
  title: string;
  description: string;
  href: string;
  status: ModuleStatus;
  statusText: string;
  details: string[];
}) {
  return (
    <article className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <StatusChip status={status} text={statusText} />
      </div>

      <ul className="mt-3 space-y-1">
        {details.map((detail) => (
          <li key={detail} className="text-xs text-muted-foreground">
            {detail}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button asChild size="sm" variant="outline" className="text-xs">
          <Link href={href}>Editar modulo</Link>
        </Button>
      </div>
    </article>
  );
}

export default async function AdminTrackEditOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trackCore, trackAudioHeader, trackRights, trackDeliverables] =
    await Promise.all([
      getTrackEditCore(id),
      getTrackAudioHeaderModule(id),
      getTrackRightsModule(id),
      getTrackDeliverablesModule(id),
    ]);

  if (!trackCore || !trackAudioHeader || !trackRights || !trackDeliverables) {
    notFound();
  }

  const assignedMoods =
    trackCore.tags?.filter((t) => t.tag.type === "MOOD").map((c) => c.tag.name) ?? [];
  const assignedUses =
    trackCore.tags?.filter((t) => t.tag.type === "USE").map((c) => c.tag.name) ?? [];
  const assignedCategories =
    trackCore.tags
      ?.filter((t) => t.tag.type === "CATALOG")
      .map((c) => ({ id: c.tag.id, slug: c.tag.slug, name: c.tag.name })) ?? [];

  const writerTotal = trackRights.publishingShares
    .filter((item) => item.role === "WRITER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const publisherTotal = trackRights.publishingShares
    .filter((item) => item.role === "PUBLISHER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const masterTotal = trackRights.masterShares.reduce(
    (sum, item) => sum + Number(item.sharePct || 0),
    0,
  );

  const rightsStatus: ModuleStatus =
    writerTotal === 100 && publisherTotal === 100 && masterTotal === 100
      ? "ok"
      : "warning";

  const idFilledCount = [trackCore.isrc, trackCore.iswc, trackCore.upc].filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  ).length;

  const modules = getTrackEditModuleNavItems(trackCore.id, {
    includeFull: true,
  });

  async function deleteTrackAction(formData: FormData) {
    "use server";

    const idFromForm = formData.get("id");
    const assetKey = (formData.get("assetKey") as string | null) || null;
    const coverUrl = (formData.get("coverUrl") as string | null) || null;

    if (!idFromForm || typeof idFromForm !== "string") {
      console.error(
        "[track:edit:deleteTrackAction] id invalido en FormData",
        idFromForm,
      );
      return;
    }

    try {
      await prisma.track.delete({
        where: { id: idFromForm },
      });

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
      return;
    }

    revalidatePath("/admin/tracks");
    redirect("/admin/tracks");
  }

  return (
    <TrackEditShell
      title={trackCore.title}
      artist={trackCore.artist}
      trackId={trackCore.id}
      modules={modules}
      activeModuleId="overview"
      headerActions={
        <>
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
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${trackCore.id}/edit/full`}>Vista completa</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/admin/tracks">Volver al listado</Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ModuleCard
          title="Creativo"
          description="Titulo, artista, modulo musical y tags creativos."
          href={`/admin/tracks/${trackCore.id}/edit/creative`}
          status={trackCore.title && trackCore.artist ? "ok" : "warning"}
          statusText={trackCore.title && trackCore.artist ? "Listo" : "Pendiente"}
          details={[
            `Moods asignados: ${assignedMoods.length}`,
            `Usos asignados: ${assignedUses.length}`,
            `Categorias asignadas: ${assignedCategories.length}`,
          ]}
        />

        <ModuleCard
          title="Derechos"
          description="Writers, publishers, masters y toggles de explotacion."
          href={`/admin/tracks/${trackCore.id}/edit/rights`}
          status={rightsStatus}
          statusText={rightsStatus === "ok" ? "Listo" : "Revisar"}
          details={[
            `Writer total: ${writerTotal}%`,
            `Publisher total: ${publisherTotal}%`,
            `Master total: ${masterTotal}%`,
          ]}
        />

        <ModuleCard
          title="Metadata"
          description="IDs y metadatos sincronizables para entrega/licensing."
          href={`/admin/tracks/${trackCore.id}/edit/metadata`}
          status={idFilledCount >= 2 ? "ok" : "warning"}
          statusText={idFilledCount >= 2 ? "Listo" : "Incompleto"}
          details={[
            `IDs completados: ${idFilledCount}/3 (ISRC/ISWC/UPC)`,
            `BPM: ${trackCore.bpm ?? "-"}`,
            `Track type: ${trackCore.trackType ?? "-"}`,
          ]}
        />

        <ModuleCard
          title="Entregables"
          description="Versiones y stems para packaging de entrega."
          href={`/admin/tracks/${trackCore.id}/edit/deliverables`}
          status={trackDeliverables.versions.length > 0 ? "ok" : "info"}
          statusText={trackDeliverables.versions.length > 0 ? "Listo" : "Vacio"}
          details={[
            `Versiones: ${trackDeliverables.versions.length}`,
            `Stems: ${trackDeliverables.stems.length}`,
            `Audio URL: ${trackAudioHeader.audioUrl ? "Si" : "No"}`,
          ]}
        />

        <ModuleCard
          title="Review"
          description="Revision consolidada final antes de publicar/entregar."
          href={`/admin/tracks/${trackCore.id}/edit/review`}
          status="info"
          statusText="Disponible"
          details={[
            "Vista resumen de control final",
            "Accesos rapidos a modulos",
            "Sin cambios de datos en esta fase",
          ]}
        />
      </section>
    </TrackEditShell>
  );
}
