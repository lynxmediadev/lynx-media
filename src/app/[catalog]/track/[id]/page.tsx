import { redirect } from "next/navigation";

type Params = { catalog: string; id: string };

export default async function CatalogScopedTrackPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  return redirect(`/track/${id}`);
}
