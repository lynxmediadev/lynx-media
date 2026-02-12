export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { DeliverablesModuleForm } from "@/components/admin/track/edit/DeliverablesModuleForm";
import {
  getTrackAudioHeaderModule,
  getTrackDeliverablesModule,
  getTrackEditCore,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditDeliverablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trackCore, audioHeader, deliverables] = await Promise.all([
    getTrackEditCore(id),
    getTrackAudioHeaderModule(id),
    getTrackDeliverablesModule(id),
  ]);

  if (!trackCore || !audioHeader || !deliverables) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackCore.id, { includeFull: true });

  return (
    <TrackEditShell
      title={trackCore.title}
      artist={trackCore.artist}
      trackId={trackCore.id}
      modules={modules}
      activeModuleId="deliverables"
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
      <DeliverablesModuleForm
        track={{
          id: trackCore.id,
          versions: deliverables.versions,
          stems: deliverables.stems,
        }}
      />
    </TrackEditShell>
  );
}
