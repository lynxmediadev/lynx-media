import CatalogClient from "@/app/catalog/CatalogClient";
import prisma from "@/lib/prisma";
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
  const categories = await prisma.tag.findMany({
    where: { type: "CATALOG" },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
  const allowed = new Set(categories.map((c) => c.slug));
  const resolvedCatalog = catalogSlug && allowed.has(catalogSlug) ? catalogSlug : null;

  const tracks = await fetchCatalogTracks({
    catalogSlug: resolvedCatalog ?? undefined,
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
      catalogSlug={resolvedCatalog ?? undefined}
      categories={categories}
    />
  );
}
