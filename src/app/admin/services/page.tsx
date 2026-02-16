import Link from "next/link";
import { Wrench } from "lucide-react";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  AdminListButton,
  AdminListHeader,
  AdminListShell,
  AdminStatusBadge,
  countActiveFilters,
} from "@/components/admin/list-kit";
import { ServicesTableClient } from "@/components/admin/services/ServicesTableClient";

export const dynamic = "force-dynamic";

type SearchDict = Record<string, string | string[] | undefined>;

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page(props: {
  searchParams: Promise<SearchDict>;
}) {
  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const status = (first(sp.status) ?? "").trim().toUpperCase();
  const category = (first(sp.category) ?? "").trim().toUpperCase();
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(10, Number.parseInt(first(sp.per) ?? "20", 10) || 20),
  );
  const skip = (page - 1) * per;

  const whereAND: Prisma.ServiceOfferWhereInput[] = [];
  if (q) {
    whereAND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (status === "ACTIVE" || status === "PAUSED" || status === "ARCHIVED") {
    whereAND.push({ status });
  }
  if (
    category === "MIX_MASTER" ||
    category === "PRODUCTION" ||
    category === "COMPOSITION" ||
    category === "SOUND_DESIGN" ||
    category === "OTHER"
  ) {
    whereAND.push({ category });
  }

  const where: Prisma.ServiceOfferWhereInput = whereAND.length
    ? { AND: whereAND }
    : {};

  const [rows, total] = await Promise.all([
    prisma.serviceOffer.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        status: true,
        priceFrom: true,
        priceTo: true,
        currency: true,
        turnaroundDays: true,
        featured: true,
        sortOrder: true,
        updatedAt: true,
      },
    }),
    prisma.serviceOffer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / per));
  const activeFilterCount = countActiveFilters([q, status, category]);

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    if (category) qs.set("category", category);
    qs.set("page", String(target));
    qs.set("per", String(per));
    return `/admin/services?${qs.toString()}`;
  };

  return (
    <section>
      <AdminListShell>
        <AdminListHeader
          icon={
            <Wrench
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          }
          title="Services"
          subtitle="Oferta comercial y operación interna"
          count={
            <AdminStatusBadge>
              Página {page} de {totalPages} · {total} servicio
              {total === 1 ? "" : "s"}
            </AdminStatusBadge>
          }
          actionSlot={
            <div className="flex items-center gap-2">
              <AdminListButton asChild size="pill" surface="background">
                <Link
                  href={buildHref(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                >
                  ← Anterior
                </Link>
              </AdminListButton>
              <AdminListButton asChild size="pill" surface="background">
                <Link
                  href={buildHref(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                >
                  Siguiente →
                </Link>
              </AdminListButton>
            </div>
          }
        />

        <ServicesTableClient
          rows={rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            category: row.category,
            status: row.status,
            priceFrom: row.priceFrom,
            priceTo: row.priceTo,
            currency: row.currency,
            turnaroundDays: row.turnaroundDays,
            featured: row.featured,
            sortOrder: row.sortOrder,
            updatedAtIso: row.updatedAt.toISOString(),
          }))}
          filters={{ q, status, category, per, activeCount: activeFilterCount }}
        />
      </AdminListShell>
    </section>
  );
}
