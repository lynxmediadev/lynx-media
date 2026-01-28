import TrackPage from "../../../track/[id]/page";

type Params = { catalog: string; id: string };

export default function CatalogScopedTrackPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <TrackPage
      params={{ id: params.id, catalog: params.catalog }}
      searchParams={searchParams as any}
    />
  );
}
