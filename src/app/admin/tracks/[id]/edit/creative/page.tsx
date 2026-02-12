export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { CreativeModuleForm } from "@/components/admin/track/edit/CreativeModuleForm";
import {
  getCatalogTagOptions,
  getMoodTagOptions,
  getTrackAudioHeaderModule,
  getTrackEditCore,
  getUseTagOptions,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditCreativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trackCore, audioHeader, moodCatalog, useCatalog, categoryCatalog] =
    await Promise.all([
      getTrackEditCore(id),
      getTrackAudioHeaderModule(id),
      getMoodTagOptions(),
      getUseTagOptions(),
      getCatalogTagOptions(),
    ]);

  if (!trackCore || !audioHeader) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackCore.id, { includeFull: true });
  const assignedMoods =
    trackCore.tags?.filter((t) => t.tag.type === "MOOD").map((c) => c.tag.name) ?? [];
  const assignedUses =
    trackCore.tags?.filter((t) => t.tag.type === "USE").map((c) => c.tag.name) ?? [];
  const assignedCategories =
    trackCore.tags
      ?.filter((t) => t.tag.type === "CATALOG")
      .map((c) => ({ id: c.tag.id, slug: c.tag.slug, name: c.tag.name })) ?? [];

  return (
    <TrackEditShell
      title={trackCore.title}
      artist={trackCore.artist}
      trackId={trackCore.id}
      modules={modules}
      activeModuleId="creative"
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
      <CreativeModuleForm
        track={{
          id: trackCore.id,
          title: trackCore.title,
          artist: trackCore.artist,
          bpm: trackCore.bpm,
          key: trackCore.key,
          trackType: trackCore.trackType,
          genres: trackCore.genres,
          subgenres: trackCore.subgenres,
          assignedMoods,
          assignedUses,
          assignedCategories,
        }}
        moodCatalog={moodCatalog}
        useCatalog={useCatalog}
        categoryCatalog={categoryCatalog}
      />
    </TrackEditShell>
  );
}
