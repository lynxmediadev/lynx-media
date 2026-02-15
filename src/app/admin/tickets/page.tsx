import Link from "next/link";
import { Bug } from "lucide-react";
import { Prisma, TicketSeverity, TicketSource, TicketStatus } from "@prisma/client";

import {
  AdminListHeader,
  AdminListShell,
  AdminStatusBadge,
  countActiveFilters,
} from "@/components/admin/list-kit";
import { TicketsTableClient } from "@/components/admin/tickets/TicketsTableClient";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchDict = Record<string, string | string[] | undefined>;

const VALID_STATUS = new Set<TicketStatus>(["OPEN", "IN_PROGRESS", "RESOLVED", "SPAM"]);
const VALID_SEVERITY = new Set<TicketSeverity>(["LOW", "MEDIUM", "HIGH"]);
const VALID_SOURCE = new Set<TicketSource>(["NOT_FOUND", "ERROR_PAGE", "MANUAL"]);

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TicketsPage(props: { searchParams: Promise<SearchDict> }) {
  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const statusRaw = (first(sp.status) ?? "").trim().toUpperCase();
  const severityRaw = (first(sp.severity) ?? "").trim().toUpperCase();
  const sourceRaw = (first(sp.source) ?? "").trim().toUpperCase();
  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(100, Math.max(10, parseInt(first(sp.per) ?? "25", 10) || 25));
  const skip = (page - 1) * per;

  const status = VALID_STATUS.has(statusRaw as TicketStatus) ? (statusRaw as TicketStatus) : null;
  const severity = VALID_SEVERITY.has(severityRaw as TicketSeverity) ? (severityRaw as TicketSeverity) : null;
  const source = VALID_SOURCE.has(sourceRaw as TicketSource) ? (sourceRaw as TicketSource) : null;

  const activeFilterCount = countActiveFilters([q, status ?? "", severity ?? "", source ?? ""]);

  const whereAND: Prisma.SupportTicketWhereInput[] = [];

  if (q) {
    whereAND.push({
      OR: [
        { summary: { contains: q, mode: "insensitive" } },
        { details: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { pageUrl: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (status) whereAND.push({ status });
  if (severity) whereAND.push({ severity });
  if (source) whereAND.push({ source });

  const where: Prisma.SupportTicketWhereInput = whereAND.length > 0 ? { AND: whereAND } : {};

  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: per,
      skip,
      select: {
        id: true,
        summary: true,
        details: true,
        status: true,
        severity: true,
        source: true,
        email: true,
        pageUrl: true,
        createdAt: true,
        reporterUserId: true,
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / per));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (severity) params.set("severity", severity);
    if (source) params.set("source", source);
    params.set("page", String(targetPage));
    params.set("per", String(per));
    return `/admin/tickets?${params.toString()}`;
  }

  return (
    <section>
      <AdminListShell className="relative bg-muted/30 backdrop-blur">
        <AdminListHeader
          icon={<Bug className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          title="Tickets tecnicos"
          subtitle="Incidentes reportados desde 404 y paginas de error"
          count={
            <AdminStatusBadge>
              Pagina {page} de {totalPages} · {total} ticket{total === 1 ? "" : "s"}
            </AdminStatusBadge>
          }
          actionSlot={
            <div className="flex items-center gap-2">
              <Link
                href={buildHref(prevPage)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
                aria-disabled={page <= 1}
              >
                ← Anterior
              </Link>
              <Link
                href={buildHref(nextPage)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
                aria-disabled={page >= totalPages}
              >
                Siguiente →
              </Link>
            </div>
          }
        />

        <TicketsTableClient
          rows={rows.map((row) => ({
            ...row,
            createdAtIso: row.createdAt.toISOString(),
          }))}
          filters={{
            q,
            status: status ?? "",
            severity: severity ?? "",
            source: source ?? "",
            activeCount: activeFilterCount,
          }}
        />
      </AdminListShell>
    </section>
  );
}
