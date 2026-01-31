import { redirect } from "next/navigation";

type Params = { catalog: string; id: string };

export default function CatalogScopedTrackPage({ params }: { params: Params }) {
  const id = params.id;
  return redirect(`/track/${id}`);
}
