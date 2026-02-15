import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AdminListHeader, AdminListShell, AdminStatusBadge, countActiveFilters } from "@/components/admin/list-kit";
import { ContractsTableClient } from "@/components/admin/contracts/ContractsTableClient";

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

  const whereAND: Prisma.ContractRecordWhereInput[] = [];
  if (q) {
    whereAND.push({
      OR: [
        { contractNumber: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { counterpartyName: { contains: q, mode: "insensitive" } },
        { counterpartyEmail: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (
    status === "DRAFT" ||
    status === "SENT" ||
    status === "NEGOTIATION" ||
    status === "SIGNED" ||
    status === "EXPIRED" ||
    status === "CANCELED"
  ) {
    whereAND.push({ status });
  }

  const where: Prisma.ContractRecordWhereInput = whereAND.length ? { AND: whereAND } : {};

  const [rows, total] = await Promise.all([
    prisma.contractRecord.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
      select: {
        id: true,
        contractNumber: true,
        title: true,
        counterpartyName: true,
        counterpartyEmail: true,
        status: true,
        amount: true,
        currency: true,
        startsAt: true,
        endsAt: true,
        signedAt: true,
        trackId: true,
        requestId: true,
        updatedAt: true,
      },
    }),
    prisma.contractRecord.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / per));
  const activeFilterCount = countActiveFilters([q, status]);

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    qs.set("page", String(target));
    qs.set("per", String(per));
    return `/admin/contracts?${qs.toString()}`;
  };

  return (
    <section>
      <AdminListShell className="relative bg-muted/30 backdrop-blur">
        <AdminListHeader
          icon={<FileCheck2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          title="Contracts"
          subtitle="Seguimiento legal y comercial"
          count={
            <AdminStatusBadge>
              Página {page} de {totalPages} · {total} contrato{total === 1 ? "" : "s"}
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

        <ContractsTableClient
          rows={rows.map((row) => ({
            id: row.id,
            contractNumber: row.contractNumber,
            title: row.title,
            counterpartyName: row.counterpartyName,
            counterpartyEmail: row.counterpartyEmail,
            status: row.status,
            amount: row.amount,
            currency: row.currency,
            startsAtIso: row.startsAt ? row.startsAt.toISOString() : null,
            endsAtIso: row.endsAt ? row.endsAt.toISOString() : null,
            signedAtIso: row.signedAt ? row.signedAt.toISOString() : null,
            trackId: row.trackId,
            requestId: row.requestId,
            updatedAtIso: row.updatedAt.toISOString(),
          }))}
          filters={{ q, status, per, activeCount: activeFilterCount }}
        />
      </AdminListShell>
    </section>
  );
}
