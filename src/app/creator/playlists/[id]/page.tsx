import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";
import {
  AdminListHeader,
  AdminListShell,
  AdminStatusBadge,
} from "@/components/admin/list-kit";
import { PlaylistDetailEditor } from "@/components/admin/playlists/PlaylistDetailEditor";
import { PlaylistShareManager } from "@/components/admin/playlists/PlaylistShareManager";
import { PlaylistTrackManager } from "@/components/admin/playlists/PlaylistTrackManager";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function CreatorPlaylistDetailPage({ params }: RouteContext) {
  const user = await requireRole(["CREATOR"], {
    redirectTo: "/auth/login?next=/creator/playlists",
  });
  if (!user) return null;

  const { id } = await params;
  const playlist = await prisma.playlist.findFirst({
    where: { id, ownerUserId: user.id },
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
      featured: true,
      sortOrder: true,
      updatedAt: true,
      createdAt: true,
      tracks: {
        orderBy: { sortOrder: "asc" },
        select: {
          sortOrder: true,
          track: {
            select: {
              id: true,
              title: true,
              artist: true,
            },
          },
        },
      },
      _count: { select: { tracks: true } },
    },
  });

  if (!playlist) notFound();

  const availableTracks = await prisma.track.findMany({
    where: { ownerUserId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, title: true, artist: true },
  });

  return (
    <section>
      <AdminListShell>
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
                href="/creator/playlists"
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
              >
                ← Volver
              </Link>
            </div>
          }
        />

        <div className="space-y-4 px-4 py-4 text-sm">
          <PlaylistDetailEditor
            allowMainCatalogToggle={false}
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

          <div className="rounded-md border border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tracks asociados ({playlist._count.tracks})
            </p>
            <ul className="space-y-1 text-sm">
              {playlist.tracks.map((item) => (
                <li key={item.track.id} className="text-muted-foreground">
                  {item.track.title} — {item.track.artist}
                </li>
              ))}
              {playlist.tracks.length === 0 ? (
                <li className="text-muted-foreground">Sin tracks asociados todavía.</li>
              ) : null}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Creada: {formatDate(playlist.createdAt)} · Actualizada:{" "}
              {formatDate(playlist.updatedAt)}
            </p>
          </div>
        </div>
      </AdminListShell>
    </section>
  );
}
