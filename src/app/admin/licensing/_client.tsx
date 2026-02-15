"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ _client.tsx (UI interactiva)                                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Pintar la lista con filtros.                                              │
 * │ - Opciones de STATUS/PRIORITY vienen del server desde enums de Prisma.     │
 * │ - Formatear fechas en el cliente para evitar hydration mismatch.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AdminDataTable,
  AdminFilterPanel,
  AdminListButton,
  AdminListEmptyState,
  AdminListHeader,
  AdminListShell,
  AdminStatusBadge,
  buildFilterQueryString,
  countActiveFilters,
  type AdminColumnDef,
} from "@/components/admin/list-kit";
import { LabeledSelect } from "@/components/admin/ui/LabeledSelect";

type Row = {
  id: string;
  createdAt: number | null; // ← timestamps (ms) enviados por el server
  updatedAt: number | null;
  nextFollowUpAt: number | null;
  assignee: string | null;
  name: string | null;
  email: string | null;
  company: string | null;
  projectType: string | null;
  media: string | null;
  territories: string[] | null;
  term: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  mfn: boolean | null;
  needWhitelist: boolean | null;
  notes: string | null;
  trackId: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  trackDurationSec: number | null;
  moods: string[] | null;
  uses: string[] | null;
  restrictions: string[] | null;
  pageUrl: string | null;
  status: string;
  internalNotes: string | null;
  priority: string | null;
};

export default function LicensingAdminClient(props: {
  rows: Row[];
  totals: {
    total: number;
    cOverdue: number;
    cToday: number;
    cTomorrow: number;
    cWeek: number;
  };
  errorMsg: string | null;
  statusOptions: string[]; // ← del enum real Prisma.RequestStatus
  priorityOptions: string[]; // ← del enum real Prisma.RequestPriority
  initialQS: {
    q: string;
    status: string;
    priority: string;
    fupFrom: string;
    fupTo: string;
    page: number;
    per: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Estado controlado del formulario (inicializado con initialQS)
  const [q, setQ] = React.useState(props.initialQS.q ?? "");
  const [status, setStatus] = React.useState(props.initialQS.status ?? "");
  const [priority, setPriority] = React.useState(
    props.initialQS.priority ?? "",
  );
  const [fupFrom, setFupFrom] = React.useState(props.initialQS.fupFrom ?? "");
  const [fupTo, setFupTo] = React.useState(props.initialQS.fupTo ?? "");

  function applyFilters(nextPage = 1) {
    const query = buildFilterQueryString({
      q,
      status,
      priority,
      fupFrom,
      fupTo,
      page: nextPage,
      per: props.initialQS.per || 20,
    });
    router.push(`${pathname}?${query}`);
  }

  const fmt = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const page = props.initialQS.page || 1;
  const per = props.initialQS.per || 20;
  const canPrev = page > 1;
  const canNext = props.totals.total > page * per;
  const activeFilters = countActiveFilters([
    q,
    status,
    priority,
    fupFrom,
    fupTo,
  ]);

  const desktopColumns: AdminColumnDef<Row>[] = [
    {
      key: "cliente",
      label: "Cliente",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-medium">
            {row.name ?? "(Sin nombre)"}
          </span>
          <span className="text-muted-foreground text-xs">
            {row.company ?? "—"}
          </span>
          <span className="text-muted-foreground text-[11px]">
            {row.email ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <div className="text-foreground font-medium">
          {row.status?.replaceAll("_", " ")}
        </div>
      ),
    },
    {
      key: "priority",
      label: "Prioridad",
      render: (row) => (
        <div className="text-foreground font-medium">{row.priority ?? "—"}</div>
      ),
    },
    {
      key: "track",
      label: "Track",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-foreground font-medium">
            {row.trackTitle ?? "—"}
          </span>
          <span className="text-muted-foreground text-[11px]">
            {row.trackArtist ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "followUp",
      label: "Follow-up",
      align: "right",
      render: (row) => (
        <div className="text-foreground font-medium">
          {row.nextFollowUpAt ? fmt.format(new Date(row.nextFollowUpAt)) : "—"}
        </div>
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <AdminListButton asChild size="row" surface="background">
          <Link href={`/admin/licensing/${row.id}`}>Abrir</Link>
        </AdminListButton>
      ),
    },
  ];

  return (
    <section>
      <AdminListShell className="bg-card/80 backdrop-blur">
        <AdminListHeader
          title="Licencias"
          subtitle="Bandeja"
          count={
            <AdminStatusBadge>Total {props.totals.total}</AdminStatusBadge>
          }
          statusBadge={
            <div className="inline-flex items-center gap-1">
              <AdminStatusBadge
                tone={props.totals.cOverdue > 0 ? "warning" : "neutral"}
              >
                Overdue {props.totals.cOverdue}
              </AdminStatusBadge>
              <AdminStatusBadge>Hoy {props.totals.cToday}</AdminStatusBadge>
              <AdminStatusBadge>
                Mañana {props.totals.cTomorrow}
              </AdminStatusBadge>
              <AdminStatusBadge>7d {props.totals.cWeek}</AdminStatusBadge>
            </div>
          }
          actionSlot={
            props.errorMsg ? (
              <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs">
                {props.errorMsg}
              </div>
            ) : null
          }
        />

        <div className="border-border border-b px-3 py-2 sm:px-4">
          <AdminFilterPanel
            title="Filtros de lista"
            statusSlot={
              <>
                <span className="text-muted-foreground text-[11px]">·</span>
                <AdminStatusBadge>
                  {activeFilters === 0
                    ? "Sin filtros"
                    : `${activeFilters} filtros activos`}
                </AdminStatusBadge>
              </>
            }
            actionSlot={
              <>
                <AdminListButton
                  size="control"
                  surface="background"
                  onClick={() => {
                    setQ("");
                    setStatus("");
                    setPriority("");
                    setFupFrom("");
                    setFupTo("");
                    const params = new URLSearchParams();
                    params.set("page", "1");
                    params.set("per", String(props.initialQS.per || 20));
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                >
                  Limpiar
                </AdminListButton>
                <AdminListButton
                  size="control"
                  surface="background"
                  onClick={() => applyFilters(1)}
                >
                  Aplicar
                </AdminListButton>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-6">
              <input
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none lg:col-span-2"
                placeholder="Buscar (cliente, email, track...)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <LabeledSelect
                label="STATUS"
                labelPosition="top"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full"
                options={[
                  { value: "", label: "TODOS" },
                  ...props.statusOptions.map((s) => ({
                    value: s,
                    label: s.replaceAll("_", " "),
                  })),
                ]}
              />
              <LabeledSelect
                label="PRIORIDAD"
                labelPosition="top"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-9 w-full"
                options={[
                  { value: "", label: "TODAS" },
                  ...props.priorityOptions.map((p) => ({ value: p, label: p })),
                ]}
              />
              <div className="grid gap-1">
                <span className="text-muted-foreground text-center text-[10px] font-semibold tracking-wide uppercase">
                  Desde
                </span>
                <input
                  type="date"
                  className="border-border bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  value={fupFrom}
                  onChange={(e) => setFupFrom(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-center text-[10px] font-semibold tracking-wide uppercase">
                  Hasta
                </span>
                <input
                  type="date"
                  className="border-border bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  value={fupTo}
                  onChange={(e) => setFupTo(e.target.value)}
                />
              </div>
            </div>
          </AdminFilterPanel>
        </div>

        {props.rows.length === 0 ? (
          <AdminListEmptyState message="No hay solicitudes para los filtros actuales." />
        ) : (
          <>
            <div className="space-y-2 p-3 md:hidden">
              {props.rows.map((row) => (
                <article
                  key={row.id}
                  className="border-border/70 bg-card space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-foreground text-sm font-semibold">
                        {row.name ?? "(Sin nombre)"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {row.email ?? "—"}
                      </p>
                    </div>
                    <AdminStatusBadge>
                      {row.status?.replaceAll("_", " ")}
                    </AdminStatusBadge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    <p>
                      Prioridad:{" "}
                      <span className="text-foreground">
                        {row.priority ?? "—"}
                      </span>
                    </p>
                    <p>
                      Track:{" "}
                      <span className="text-foreground">
                        {row.trackTitle ?? "—"}
                      </span>
                    </p>
                    <p>
                      Follow-up:{" "}
                      <span className="text-foreground">
                        {row.nextFollowUpAt
                          ? fmt.format(new Date(row.nextFollowUpAt))
                          : "—"}
                      </span>
                    </p>
                  </div>
                  <AdminListButton
                    asChild
                    size="row"
                    surface="background"
                    className="w-full"
                  >
                    <Link href={`/admin/licensing/${row.id}`}>Abrir</Link>
                  </AdminListButton>
                </article>
              ))}
            </div>

            <div className="hidden md:block">
              <AdminDataTable
                rows={props.rows}
                columns={desktopColumns}
                rowKey={(row) => row.id}
                rowClassName="border-t border-border/80 hover:bg-muted/40"
                tableClassName="w-full table-auto"
                headerClassName="bg-muted/60"
              />
            </div>
          </>
        )}

        <footer className="border-border text-muted-foreground flex items-center justify-between gap-3 border-t px-3 py-3 text-sm sm:px-4">
          <span>
            Página {page} · {props.rows.length} de {props.totals.total}
          </span>
          <div className="flex gap-2">
            <AdminListButton
              type="button"
              disabled={!canPrev}
              onClick={() => applyFilters(page - 1)}
              size="control"
              surface="background"
            >
              Anterior
            </AdminListButton>
            <AdminListButton
              type="button"
              disabled={!canNext}
              onClick={() => applyFilters(page + 1)}
              size="control"
              surface="background"
            >
              Siguiente
            </AdminListButton>
          </div>
        </footer>
      </AdminListShell>
    </section>
  );
}
