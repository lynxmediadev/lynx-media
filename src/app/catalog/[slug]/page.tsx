import { redirect } from "next/navigation";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyCatalogSlugRedirectPage({ params }: RouteContext) {
  const { slug } = await params;
  redirect(`/playlist/${encodeURIComponent(slug)}`);
}

