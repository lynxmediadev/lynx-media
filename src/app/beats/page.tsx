import CatalogView from "@/components/catalog/CatalogView";

export const dynamic = "force-dynamic";

export default async function BeatsPage() {
  return (
    <CatalogView
      catalogSlug="beats"
      eyebrow="Catálogo · Beats"
      title="Beats / Instrumentales"
      subtitle="Instrumentales listas para escribir encima, con play rápido y acciones."
    />
  );
}
export const metadata = {
  alternates: { canonical: "/catalog" },
};
