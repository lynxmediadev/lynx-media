import CatalogView from "@/components/catalog/CatalogView";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp =
    searchParams && "then" in (searchParams as Promise<SearchParams>)
      ? await (searchParams as Promise<SearchParams>)
      : (searchParams as SearchParams | undefined);

  const moods = toArray(sp?.mood).map((m) => m.trim()).filter(Boolean);
  const uses = toArray(sp?.use).map((u) => u.trim()).filter(Boolean);
  const artist = pickFirst(sp?.artist)?.trim() ?? "";
  const q = pickFirst(sp?.q)?.trim() ?? "";

  return (
    <CatalogView
      catalogSlug={null}
      filters={{ moods, uses, artist: artist || undefined, q: q || undefined }}
      eyebrow="Catálogo general"
      title="Catálogo público"
      subtitle="Lista compacta con reproductor y acciones rápidas."
    />
  );
}
