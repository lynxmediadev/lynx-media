import Link from "next/link";
import { ListMusic } from "lucide-react";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AdminListHeader, AdminListShell, AdminStatusBadge, countActiveFilters } from "@/components/admin/list-kit";
import { PlaylistsTableClient } from "@/components/admin/playlists/PlaylistsTableClient";

export const dynamic = "force-dynamic";

type SearchDict = Record<string, string | string[] | undefined>;

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page(props: { searchParams: Promise<SearchDict> }) {
  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const status = (first(sp.status) ?? "").trim().toUpperCase();
  const visibility = (first(sp.visibility) ?? "").trim().toUpperCase();
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(100, Math.max(10, Number.parseInt(first(sp.per) ?? "20", 10) || 20));
  const skip = (page - 1) * per;

  const whereAND: Prisma.PlaylistWhereInput[] = [];
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
  if (visibility === "PRIVATE" || visibility === "INTERNAL" || visibility === "PUBLIC") {
    whereAND.push({ visibility });
  }

  const where: Prisma.PlaylistWhereInput = whereAND.length ? { AND: whereAND } : {};

  const [rows, total] = await Promise.all([
    prisma.playlist.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        visibility: true,
        featured: true,
        sortOrder: true,
        updatedAt: true,
        _count: {
          select: {
            tracks: true,
          },
        },
      },
    }),
    prisma.playlist.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / per));
  const activeFilterCount = countActiveFilters([q, status, visibility]);

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    if (visibility) qs.set("visibility", visibility);
    qs.set("page", String(target));
    qs.set("per", String(per));
    return `/admin/playlists?${qs.toString()}`;
  };

  return (
    <section>
      <AdminListShell className="relative bg-muted/30 backdrop-blur">
        <AdminListHeader
          icon={<ListMusic className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          title="Playlists"
          subtitle="Gestión editorial y orden de catálogo"
          count={
            <AdminStatusBadge>
              Página {page} de {totalPages} · {total} playlist{total === 1 ? "" : "s"}
            </AdminStatusBadge>
          }
          actionSlot={
            <div className="flex items-center gap-2">
              <Link
                href={buildHref(Math.max(1, page - 1))}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
                aria-disabled={page <= 1}
              >
                ← Anterior
              </Link>
              <Link
                href={buildHref(Math.min(totalPages, page + 1))}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
                aria-disabled={page >= totalPages}
              >
                Siguiente →
              </Link>
            </div>
          }
        />

        <PlaylistsTableClient
          rows={rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            status: row.status,
            visibility: row.visibility,
            featured: row.featured,
            sortOrder: row.sortOrder,
            trackCount: row._count.tracks,
            updatedAtIso: row.updatedAt.toISOString(),
          }))}
          filters={{ q, status, visibility, per, activeCount: activeFilterCount }}
        />
      </AdminListShell>
    </section>
  );
}
