import CatalogView from "@/components/catalog/CatalogView";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  return (
    <CatalogView
      catalogSlug="sync"
      eyebrow="Catálogo · Sync"
      title="Sync Licensing"
      subtitle="Música lista para proyectos audiovisuales y comerciales."
    />
  );
}
