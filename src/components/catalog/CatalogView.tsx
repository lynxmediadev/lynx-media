import CatalogClient from "@/app/catalog/CatalogClient";
import { fetchCatalogTracks, type CatalogFilters } from "@/lib/catalog/fetchCatalog";

export default async function CatalogView({
  catalogSlug,
  filters = {},
  title,
  subtitle,
  eyebrow,
}: {
  catalogSlug?: string | null;
  filters?: CatalogFilters;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const whereAND: any[] = [];
  const tracks = await fetchCatalogTracks({
    catalogSlug: catalogSlug ?? undefined,
    moods: filters.moods,
    uses: filters.uses,
    artist: filters.artist,
    q: filters.q,
  });

  return (
    <CatalogClient
      tracks={tracks}
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      catalogSlug={catalogSlug ?? undefined}
    />
  );
}
