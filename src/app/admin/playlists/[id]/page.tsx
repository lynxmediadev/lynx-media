import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminListShell, AdminListHeader, AdminStatusBadge } from "@/components/admin/list-kit";
import { PlaylistDetailEditor } from "@/components/admin/playlists/PlaylistDetailEditor";
import { PlaylistShareManager } from "@/components/admin/playlists/PlaylistShareManager";
import { PlaylistTrackManager } from "@/components/admin/playlists/PlaylistTrackManager";
import { getCurrentUser } from "@/lib/account-auth/guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function Page({ params }: RouteContext) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const canManageAllTracks =
    currentUser?.role === "ADMIN" || currentUser?.role === "STAFF";
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      publicId: true,
      slug: true,
      description: true,
      status: true,
      visibility: true,
      embedEnabled: true,
      isMainCatalog: true,
      isAutoAllTracks: true,
      ownerUserId: true,
      featured: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      tracks: {
        orderBy: { sortOrder: "asc" },
        select: {
          sortOrder: true,
          track: {
            select: { id: true, title: true, artist: true },
          },
        },
      },
      _count: { select: { tracks: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!playlist) notFound();

  const previewTracks = playlist.isAutoAllTracks
    ? await prisma.track.findMany({
        where: { ownerUserId: playlist.ownerUserId ?? undefined },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          artist: true,
        },
      })
    : playlist.tracks.map((item) => item.track);

  const trackCount = playlist.isAutoAllTracks
    ? await prisma.track.count({ where: { ownerUserId: playlist.ownerUserId ?? undefined } })
    : playlist._count.tracks;
  const availableTracks = await prisma.track.findMany({
    where:
      canManageAllTracks || !playlist.ownerUserId
        ? undefined
        : { ownerUserId: playlist.ownerUserId },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, title: true, artist: true },
  });

  return (
    <section>
      <AdminListShell className="bg-muted/30">
        <AdminListHeader
          title={playlist.name}
          subtitle="Detalle de playlist"
          count={<AdminStatusBadge>{playlist.status}</AdminStatusBadge>}
          actionSlot={
            <div className="flex items-center gap-2">
              <Link
                href={`/playlist/${playlist.publicId}`}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
              >
                Ver pública
              </Link>
              <Link
                href="/admin/playlists"
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
              >
                ← Volver
              </Link>
            </div>
          }
        />

        <div className="space-y-4 px-4 py-4 text-sm">
          <PlaylistDetailEditor
            item={{
              id: playlist.id,
              name: playlist.name,
              publicId: playlist.publicId,
              slug: playlist.slug,
              description: playlist.description,
              status: playlist.status,
              visibility: playlist.visibility,
              embedEnabled: playlist.embedEnabled,
              isMainCatalog: playlist.isMainCatalog,
              isAutoAllTracks: playlist.isAutoAllTracks,
              featured: playlist.featured,
              sortOrder: playlist.sortOrder,
            }}
          />

          <PlaylistTrackManager
            playlistId={playlist.id}
            canEdit={!playlist.isAutoAllTracks}
            isAutoAllTracks={playlist.isAutoAllTracks}
            assignedTracks={playlist.tracks.map((item) => ({
              id: item.track.id,
              title: item.track.title,
              artist: item.track.artist,
              sortOrder: item.sortOrder,
            }))}
            availableTracks={availableTracks}
          />

          <PlaylistShareManager playlistId={playlist.id} canManage />

          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Slug" value={playlist.slug} mono />
            <Info label="Public ID" value={playlist.publicId} mono />
            <Info label="Visibilidad" value={playlist.visibility} />
            <Info label="Main catalog" value={playlist.isMainCatalog ? "Sí" : "No"} />
            <Info label="Embed" value={playlist.embedEnabled ? "Sí" : "No"} />
            <Info label="All tracks dinámico" value={playlist.isAutoAllTracks ? "Sí" : "No"} />
            <Info label="Destacada" value={playlist.featured ? "Sí" : "No"} />
            <Info label="Orden" value={String(playlist.sortOrder)} />
            <Info label="Tracks" value={String(trackCount)} />
            <Info label="Actualizada" value={formatDate(playlist.updatedAt)} />
            <Info
              label="Owner"
              value={
                playlist.owner
                  ? `${playlist.owner.name || "(sin nombre)"} · ${playlist.owner.email}`
                  : "Sin owner"
              }
            />
          </div>

          {playlist.description ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción</p>
              <p className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm">{playlist.description}</p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tracks ({trackCount})</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Título</th>
                    <th className="px-3 py-2">Artista</th>
                  </tr>
                </thead>
                <tbody>
                  {previewTracks.map((item, index) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{item.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.artist}</td>
                    </tr>
                  ))}
                  {previewTracks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                        No hay tracks asociados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Creada: {formatDate(playlist.createdAt)}</p>
        </div>
      </AdminListShell>
    </section>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-xs break-all" : "text-sm"}>{value}</p>
    </div>
  );
}
