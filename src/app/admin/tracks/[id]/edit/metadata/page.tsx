export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { MetadataModuleForm } from "@/components/admin/track/edit/MetadataModuleForm";
import {
  getTrackAudioHeaderModule,
  getTrackEditCore,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditMetadataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trackCore, audioHeader] = await Promise.all([
    getTrackEditCore(id),
    getTrackAudioHeaderModule(id),
  ]);

  if (!trackCore || !audioHeader) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackCore.id, { includeFull: true });

  return (
    <TrackEditShell
      title={trackCore.title}
      artist={trackCore.artist}
      trackId={trackCore.id}
      modules={modules}
      activeModuleId="metadata"
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
      <MetadataModuleForm
        track={{
          id: trackCore.id,
          isrc: trackCore.isrc,
          iswc: trackCore.iswc,
          upc: trackCore.upc,
          licenseType: trackCore.licenseType,
          mediaBuy: trackCore.mediaBuy,
          exclusiveTerritories: trackCore.exclusiveTerritories ?? [],
          exclusiveTermMonths: trackCore.exclusiveTermMonths,
          restrictedTerritories: trackCore.restrictedTerritories ?? [],
          restrictedIndustries: trackCore.restrictedIndustries ?? [],
          restrictedPlatforms: trackCore.restrictedPlatforms ?? [],
          restrictedBrands: trackCore.restrictedBrands ?? [],
          restrictions: trackCore.restrictions ?? [],
          pricingTier: trackCore.pricingTier,
          budgetMin: trackCore.budgetMin,
          budgetMax: trackCore.budgetMax,
          budgetCurrency: trackCore.budgetCurrency,
        }}
      />
    </TrackEditShell>
  );
}
