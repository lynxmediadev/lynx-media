export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { RightsModuleForm } from "@/components/admin/track/edit/RightsModuleForm";
import {
  getTrackAudioHeaderModule,
  getTrackEditCore,
  getTrackRightsModule,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditRightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trackCore, audioHeader, rightsModule] = await Promise.all([
    getTrackEditCore(id),
    getTrackAudioHeaderModule(id),
    getTrackRightsModule(id),
  ]);

  if (!trackCore || !audioHeader || !rightsModule) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackCore.id, { includeFull: true });

  return (
    <TrackEditShell
      title={trackCore.title}
      artist={trackCore.artist}
      trackId={trackCore.id}
      modules={modules}
      activeModuleId="rights"
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
      <RightsModuleForm
        trackId={trackCore.id}
        track={{
          mfn: !!trackCore.mfn,
          contentIdEnrolled: !!trackCore.contentIdEnrolled,
          contentIdAdmin: trackCore.contentIdAdmin ?? "",
          contentIdWhitelist: trackCore.contentIdWhitelist ?? "",
          master: rightsModule.master ?? "",
          oneStop: !!trackCore.oneStop,
          clearedForSync: !!trackCore.clearedForSync,
          publishingShares: rightsModule.publishingShares,
          masterShares: rightsModule.masterShares,
          restrictions: trackCore.restrictions ?? [],
        }}
      />
    </TrackEditShell>
  );
}
