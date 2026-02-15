import Link from "next/link";
import { Waves } from "lucide-react";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AdminListHeader, AdminListShell, AdminStatusBadge, countActiveFilters } from "@/components/admin/list-kit";
import { SoundKitsTableClient } from "@/components/admin/sound-kits/SoundKitsTableClient";

export const dynamic = "force-dynamic";

type SearchDict = Record<string, string | string[] | undefined>;

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page(props: { searchParams: Promise<SearchDict> }) {
  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const status = (first(sp.status) ?? "").trim().toUpperCase();
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(100, Math.max(10, Number.parseInt(first(sp.per) ?? "20", 10) || 20));
  const skip = (page - 1) * per;

  const whereAND: Prisma.SoundKitWhereInput[] = [];
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

  const where: Prisma.SoundKitWhereInput = whereAND.length ? { AND: whereAND } : {};

  const [rows, total] = await Promise.all([
    prisma.soundKit.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        price: true,
        currency: true,
        featured: true,
        sortOrder: true,
        updatedAt: true,
      },
    }),
    prisma.soundKit.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / per));
  const activeFilterCount = countActiveFilters([q, status]);

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    qs.set("page", String(target));
    qs.set("per", String(per));
    return `/admin/sound-kits?${qs.toString()}`;
  };

  return (
    <section>
      <AdminListShell className="relative bg-muted/30 backdrop-blur">
        <AdminListHeader
          icon={<Waves className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          title="Sound Kits"
          subtitle="Packs, samples y recursos reutilizables"
          count={
            <AdminStatusBadge>
              Página {page} de {totalPages} · {total} kit{total === 1 ? "" : "s"}
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

        <SoundKitsTableClient
          rows={rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            status: row.status,
            price: row.price,
            currency: row.currency,
            featured: row.featured,
            sortOrder: row.sortOrder,
            updatedAtIso: row.updatedAt.toISOString(),
          }))}
          filters={{ q, status, per, activeCount: activeFilterCount }}
        />
      </AdminListShell>
    </section>
  );
}
