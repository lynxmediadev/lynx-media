import { ListMusic } from "lucide-react";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/account-auth/guards";
import {
  AdminListHeader,
  AdminListShell,
  AdminStatusBadge,
  countActiveFilters,
} from "@/components/admin/list-kit";
import { PlaylistsTableClient } from "@/components/admin/playlists/PlaylistsTableClient";

export const dynamic = "force-dynamic";

type SearchDict = Record<string, string | string[] | undefined>;

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CreatorPlaylistsPage(props: {
  searchParams: Promise<SearchDict>;
}) {
  const user = await requireRole(["CREATOR"], {
    redirectTo: "/auth/login?next=/creator/playlists",
  });
  if (!user) return null;

  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const status = (first(sp.status) ?? "").trim().toUpperCase();
  const visibility = (first(sp.visibility) ?? "").trim().toUpperCase();
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(10, Number.parseInt(first(sp.per) ?? "20", 10) || 20),
  );
  const skip = (page - 1) * per;

  const whereAND: Prisma.PlaylistWhereInput[] = [{ ownerUserId: user.id }];
  if (q) {
    whereAND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED") {
    whereAND.push({ status });
  }
  if (
    visibility === "PRIVATE" ||
    visibility === "INTERNAL" ||
    visibility === "PUBLIC"
  ) {
    whereAND.push({ visibility });
  }

  const where: Prisma.PlaylistWhereInput = { AND: whereAND };

  const [rows, total] = await Promise.all([
    prisma.playlist.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
      select: {
        id: true,
        name: true,
        publicId: true,
        slug: true,
        status: true,
        visibility: true,
        embedEnabled: true,
        isMainCatalog: true,
        isAutoAllTracks: true,
        featured: true,
        sortOrder: true,
        updatedAt: true,
        _count: { select: { tracks: true } },
      },
    }),
    prisma.playlist.count({ where }),
  ]);

  const activeFilterCount = countActiveFilters([q, status, visibility]);

  return (
    <section>
      <AdminListShell>
        <AdminListHeader
          icon={
            <ListMusic
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          }
          title="Playlists"
          subtitle="Biblioteca de playlists de tu cuenta"
          count={
            <AdminStatusBadge>
              Página {page} · {total} playlist{total === 1 ? "" : "s"}
            </AdminStatusBadge>
          }
        />

        <PlaylistsTableClient
          basePath="/creator/playlists"
          allowBulk={false}
          rows={rows.map((row) => ({
            id: row.id,
            name: row.name,
            publicId: row.publicId,
            slug: row.slug,
            status: row.status,
            visibility: row.visibility,
            embedEnabled: row.embedEnabled,
            isMainCatalog: row.isMainCatalog,
            isAutoAllTracks: row.isAutoAllTracks,
            featured: row.featured,
            sortOrder: row.sortOrder,
            trackCount: row._count.tracks,
            updatedAtIso: row.updatedAt.toISOString(),
          }))}
          filters={{
            q,
            status,
            visibility,
            per,
            activeCount: activeFilterCount,
          }}
        />
      </AdminListShell>
    </section>
  );
}
