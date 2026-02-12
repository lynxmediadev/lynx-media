export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import {
  getTrackAudioHeaderModule,
  getTrackDeliverablesModule,
  getTrackEditCore,
  getTrackRightsModule,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trackCore, audioHeader, rights, deliverables] = await Promise.all([
    getTrackEditCore(id),
    getTrackAudioHeaderModule(id),
    getTrackRightsModule(id),
    getTrackDeliverablesModule(id),
  ]);

  if (!trackCore || !audioHeader || !rights || !deliverables) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackCore.id, { includeFull: true });

  const assignedMoods =
    trackCore.tags?.filter((t) => t.tag.type === "MOOD").map((c) => c.tag.name) ?? [];
  const assignedUses =
    trackCore.tags?.filter((t) => t.tag.type === "USE").map((c) => c.tag.name) ?? [];
  const assignedCategories =
    trackCore.tags?.filter((t) => t.tag.type === "CATALOG").map((c) => c.tag.name) ?? [];

  const writerTotal = rights.publishingShares
    .filter((item) => item.role === "WRITER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const publisherTotal = rights.publishingShares
    .filter((item) => item.role === "PUBLISHER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const masterTotal = rights.masterShares.reduce(
    (sum, item) => sum + Number(item.sharePct || 0),
    0,
  );

  return (
    <TrackEditShell
      title={trackCore.title}
      artist={trackCore.artist}
      trackId={trackCore.id}
      modules={modules}
      activeModuleId="review"
      headerActions={
        <>
          <TrackAnalyzeHeaderButtons
            id={trackCore.id}
            audioUrl={audioHeader.audioUrl}
          />
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${trackCore.id}/edit/full`}>Vista completa</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${trackCore.id}/edit`}>Overview</Link>
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
            <li>Titulo: {trackCore.title ?? "-"}</li>
            <li>Artista: {trackCore.artist ?? "-"}</li>
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
            <li>One-Stop: {trackCore.oneStop ? "Si" : "No"}</li>
            <li>Cleared: {trackCore.clearedForSync ? "Si" : "No"}</li>
          </ul>
        </article>

        <article className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Metadata y entrega
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>ISRC: {trackCore.isrc ?? "-"}</li>
            <li>ISWC: {trackCore.iswc ?? "-"}</li>
            <li>UPC: {trackCore.upc ?? "-"}</li>
            <li>Versiones: {deliverables.versions.length}</li>
            <li>Stems: {deliverables.stems.length}</li>
          </ul>
        </article>
      </section>
    </TrackEditShell>
  );
}
