import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminListShell, AdminListHeader, AdminStatusBadge } from "@/components/admin/list-kit";
import { PlaylistDetailEditor } from "@/components/admin/playlists/PlaylistDetailEditor";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function Page({ params }: RouteContext) {
  const { id } = await params;
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      visibility: true,
      featured: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      tracks: {
        orderBy: { sortOrder: "asc" },
        take: 10,
        select: {
          sortOrder: true,
          track: {
            select: { id: true, title: true, artist: true },
          },
        },
      },
      _count: { select: { tracks: true } },
    },
  });

  if (!playlist) notFound();

  return (
    <section>
      <AdminListShell className="bg-muted/30">
        <AdminListHeader
          title={playlist.name}
          subtitle="Detalle de playlist"
          count={<AdminStatusBadge>{playlist.status}</AdminStatusBadge>}
          actionSlot={
            <Link
              href="/admin/playlists"
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
            >
              ← Volver
            </Link>
          }
        />

        <div className="space-y-4 px-4 py-4 text-sm">
          <PlaylistDetailEditor
            item={{
              id: playlist.id,
              name: playlist.name,
              slug: playlist.slug,
              description: playlist.description,
              status: playlist.status,
              visibility: playlist.visibility,
              featured: playlist.featured,
              sortOrder: playlist.sortOrder,
            }}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Slug" value={playlist.slug} mono />
            <Info label="Visibilidad" value={playlist.visibility} />
            <Info label="Destacada" value={playlist.featured ? "Sí" : "No"} />
            <Info label="Orden" value={String(playlist.sortOrder)} />
            <Info label="Tracks" value={String(playlist._count.tracks)} />
            <Info label="Actualizada" value={formatDate(playlist.updatedAt)} />
          </div>

          {playlist.description ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción</p>
              <p className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm">{playlist.description}</p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tracks ({playlist._count.tracks})</p>
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
                  {playlist.tracks.map((item) => (
                    <tr key={item.track.id} className="border-t border-border">
                      <td className="px-3 py-2">{item.sortOrder}</td>
                      <td className="px-3 py-2">{item.track.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.track.artist}</td>
                    </tr>
                  ))}
                  {playlist.tracks.length === 0 ? (
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
