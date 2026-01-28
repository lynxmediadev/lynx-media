import CatalogView from "@/components/catalog/CatalogView";

export const dynamic = "force-dynamic";

export default async function GamesCatalogPage() {
  return (
    <CatalogView
      catalogSlug="games"
      eyebrow="Catálogo · Games"
      title="Música para Videojuegos"
      subtitle="Pistas curadas para gameplay, cinemáticas y trailers."
    />
  );
}
