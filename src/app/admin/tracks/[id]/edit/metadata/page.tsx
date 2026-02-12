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
  getTrackMetadataPageData,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditMetadataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const metadataPageData = await getTrackMetadataPageData(id);

  if (!metadataPageData) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(metadataPageData.id, { includeFull: true });

  return (
    <TrackEditShell
      title={metadataPageData.title}
      artist={metadataPageData.artist}
      trackId={metadataPageData.id}
      modules={modules}
      activeModuleId="metadata"
      headerActions={
        <>
          <TrackAnalyzeHeaderButtons
            id={metadataPageData.id}
            audioUrl={metadataPageData.audioUrl}
          />
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${metadataPageData.id}/edit/full`}>Vista completa</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/admin/tracks/${metadataPageData.id}/edit`}>Overview</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/admin/tracks">Volver al listado</Link>
          </Button>
        </>
      }
    >
      <MetadataModuleForm
        track={{
          id: metadataPageData.id,
          isrc: metadataPageData.isrc,
          iswc: metadataPageData.iswc,
          upc: metadataPageData.upc,
          licenseType: metadataPageData.licenseType,
          mediaBuy: metadataPageData.mediaBuy,
          exclusiveTerritories: metadataPageData.exclusiveTerritories ?? [],
          exclusiveTermMonths: metadataPageData.exclusiveTermMonths,
          restrictedTerritories: metadataPageData.restrictedTerritories ?? [],
          restrictedIndustries: metadataPageData.restrictedIndustries ?? [],
          restrictedPlatforms: metadataPageData.restrictedPlatforms ?? [],
          restrictedBrands: metadataPageData.restrictedBrands ?? [],
          restrictions: metadataPageData.restrictions ?? [],
          pricingTier: metadataPageData.pricingTier,
          budgetMin: metadataPageData.budgetMin,
          budgetMax: metadataPageData.budgetMax,
          budgetCurrency: metadataPageData.budgetCurrency,
        }}
      />
    </TrackEditShell>
  );
}
