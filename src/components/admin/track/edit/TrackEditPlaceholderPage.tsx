import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getTrackEditCore } from "@/server/track-edit/queries";

import { TrackEditModulePlaceholder } from "./TrackEditModulePlaceholder";
import { TrackEditShell } from "./TrackEditShell";
import {
  getTrackEditModuleNavItems,
  type TrackEditModuleId,
} from "./module-nav";

export async function TrackEditPlaceholderPage({
  trackId,
  activeModuleId,
  title,
  description,
}: {
  trackId: string;
  activeModuleId: TrackEditModuleId;
  title: string;
  description: string;
}) {
  const trackCore = await getTrackEditCore(trackId);
  if (!trackCore) notFound();

  const modules = getTrackEditModuleNavItems(trackId, { includeFull: true });

  return (
    <TrackEditShell
      title={trackCore.title}
      artist={trackCore.artist}
      trackId={trackCore.id}
      modules={modules}
      activeModuleId={activeModuleId}
      headerActions={
        <>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${trackCore.id}/edit/full`}>Vista completa</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${trackCore.id}/edit`}>Volver al overview</Link>
          </Button>
        </>
      }
    >
      <TrackEditModulePlaceholder
        title={title}
        description={description}
        trackId={trackCore.id}
      />
    </TrackEditShell>
  );
}
