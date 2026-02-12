export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import {
  getTrackOverviewPageData,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trackOverview = await getTrackOverviewPageData(id);
  if (!trackOverview) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackOverview.id, { includeFull: true });

  const assignedMoods =
    trackOverview.tags?.filter((t) => t.tag.type === "MOOD").map((c) => c.tag.name) ?? [];
  const assignedUses =
    trackOverview.tags?.filter((t) => t.tag.type === "USE").map((c) => c.tag.name) ?? [];
  const assignedCategories =
    trackOverview.tags?.filter((t) => t.tag.type === "CATALOG").map((c) => c.tag.name) ?? [];

  const writerTotal = trackOverview.publishingShares
    .filter((item) => item.role === "WRITER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const publisherTotal = trackOverview.publishingShares
    .filter((item) => item.role === "PUBLISHER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const masterTotal = trackOverview.masterShares.reduce(
    (sum, item) => sum + Number(item.sharePct || 0),
    0,
  );

  return (
    <TrackEditShell
      title={trackOverview.title}
      artist={trackOverview.artist}
      trackId={trackOverview.id}
      modules={modules}
      activeModuleId="review"
      headerActions={
        <>
          <TrackAnalyzeHeaderButtons
            id={trackOverview.id}
            audioUrl={trackOverview.audioUrl}
          />
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${trackOverview.id}/edit/full`}>Vista completa</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${trackOverview.id}/edit`}>Overview</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/admin/tracks">Volver al listado</Link>
          </Button>
        </>
      }
    >
      <section className="rounded-lg border border-border bg-card/50 p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Revision consolidada
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Verifica estado final antes de publicar o exportar payload.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Creativo
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>Titulo: {trackOverview.title ?? "-"}</li>
            <li>Artista: {trackOverview.artist ?? "-"}</li>
            <li>Moods: {assignedMoods.length}</li>
            <li>Usos: {assignedUses.length}</li>
            <li>Categorias: {assignedCategories.length}</li>
          </ul>
        </article>

        <article className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Derechos
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>Writer total: {writerTotal}%</li>
            <li>Publisher total: {publisherTotal}%</li>
            <li>Master total: {masterTotal}%</li>
            <li>One-Stop: {trackOverview.oneStop ? "Si" : "No"}</li>
            <li>Cleared: {trackOverview.clearedForSync ? "Si" : "No"}</li>
          </ul>
        </article>

        <article className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Metadata y entrega
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>ISRC: {trackOverview.isrc ?? "-"}</li>
            <li>ISWC: {trackOverview.iswc ?? "-"}</li>
            <li>UPC: {trackOverview.upc ?? "-"}</li>
            <li>Versiones: {trackOverview._count.versions}</li>
            <li>Stems: {trackOverview._count.stems}</li>
          </ul>
        </article>
      </section>
    </TrackEditShell>
  );
}
