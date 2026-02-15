"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  Bug,
  Check,
  Clock3,
  Eye,
  Filter,
  RefreshCcw,
  Search,
  Wrench,
} from "lucide-react";

import { LabeledSelect } from "@/components/admin/ui/LabeledSelect";
import {
  allSelected as computeAllSelected,
  AdminBulkPanel,
  AdminControlsRow,
  AdminDataTable,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListEmptyState,
  AdminStatusBadge,
  countActiveFilters,
  selectAllOrNone,
  toggleSelection,
  type AdminColumnDef,
} from "@/components/admin/list-kit";
import { cn } from "@/lib/utils";

export type TicketRow = {
  id: string;
  summary: string;
  details: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "SPAM";
  severity: "LOW" | "MEDIUM" | "HIGH";
  source: "NOT_FOUND" | "ERROR_PAGE" | "MANUAL";
  email: string | null;
  pageUrl: string | null;
  createdAtIso: string;
  reporterUserId: string | null;
};

type TicketsTableClientProps = {
  rows: TicketRow[];
  filters: {
    q: string;
    status: string;
    severity: string;
    source: string;
    activeCount: number;
  };
};

type BulkAction = "set_status" | "delete";

type BulkStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "SPAM";

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-CL");
}

function truncate(text: string, max = 88) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function statusBadge(status: TicketRow["status"]) {
  if (status === "OPEN") {
    return <AdminIconBadge tone="warning" icon={<Clock3 aria-hidden="true" />} label="OPEN" />;
  }
  if (status === "IN_PROGRESS") {
    return <AdminIconBadge tone="neutral" icon={<Wrench aria-hidden="true" />} label="IN PROGRESS" />;
  }
  if (status === "RESOLVED") {
    return <AdminIconBadge tone="success" icon={<Check aria-hidden="true" />} label="RESOLVED" />;
  }
  return <AdminIconBadge tone="danger" icon={<Ban aria-hidden="true" />} label="SPAM" />;
}

function severityBadge(severity: TicketRow["severity"]) {
  if (severity === "HIGH") {
    return <AdminIconBadge tone="danger" icon={<AlertTriangle aria-hidden="true" />} label="HIGH" />;
  }
  if (severity === "MEDIUM") {
    return <AdminIconBadge tone="warning" icon={<AlertTriangle aria-hidden="true" />} label="MEDIUM" />;
  }
  return <AdminIconBadge tone="neutral" icon={<Bug aria-hidden="true" />} label="LOW" />;
}

function sourceBadge(source: TicketRow["source"]) {
  if (source === "NOT_FOUND") {
    return <AdminIconBadge tone="warning" icon={<Search aria-hidden="true" />} label="404" />;
  }
  if (source === "ERROR_PAGE") {
    return <AdminIconBadge tone="danger" icon={<AlertTriangle aria-hidden="true" />} label="ERROR PAGE" />;
  }
  return <AdminIconBadge tone="neutral" icon={<Bug aria-hidden="true" />} label="MANUAL" />;
}

export function TicketsTableClient({ rows, filters }: TicketsTableClientProps) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("set_status");
  const [bulkStatus, setBulkStatus] = useState<BulkStatus>("IN_PROGRESS");
  const [localQuery, setLocalQuery] = useState(filters.q);
  const [localStatus, setLocalStatus] = useState(filters.status);
  const [localSeverity, setLocalSeverity] = useState(filters.severity);
  const [localSource, setLocalSource] = useState(filters.source);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [bulkState, setBulkState] = useState<{ type: "idle" | "running" | "success" | "error"; message: string }>(
    { type: "idle", message: "" },
  );

  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectableIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = computeAllSelected(selectedIds, selectableIds);
  const selectionStateLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} ${selectedIds.length === 1 ? "seleccionado" : "seleccionados"}`
      : "sin seleccion";

  const localActiveCount = countActiveFilters([
    localQuery.trim().toLowerCase(),
    localStatus,
    localSeverity,
    localSource,
  ]);
  const filterStateLabel =
    localActiveCount === 0
      ? "sin filtros"
      : `${localActiveCount} ${localActiveCount === 1 ? "filtro activo" : "filtros activos"}`;

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      if (bulkResetRef.current) clearTimeout(bulkResetRef.current);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();
      const q = localQuery.trim();
      if (q) params.set("q", q);
      if (localStatus) params.set("status", localStatus);
      if (localSeverity) params.set("severity", localSeverity);
      if (localSource) params.set("source", localSource);
      params.set("page", "1");

      const query = params.toString();
      const nextPath = `${window.location.pathname}?${query}`;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (nextPath !== currentPath) {
        router.replace(nextPath, { scroll: false });
      }
    }, 130);

    return () => window.clearTimeout(timeoutId);
  }, [localQuery, localSeverity, localSource, localStatus, router]);

  async function handleCopyFilter() {
    const params = new URLSearchParams();
    const q = localQuery.trim();
    if (q) params.set("q", q);
    if (localStatus) params.set("status", localStatus);
    if (localSeverity) params.set("severity", localSeverity);
    if (localSource) params.set("source", localSource);
    params.set("page", "1");
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => setCopyState("idle"), 1600);
  }

  async function handleBulkApply() {
    if (selectedIds.length === 0 || bulkState.type === "running") return;

    if (bulkAction === "delete") {
      const confirmed = window.confirm(
        `Eliminar ${selectedIds.length} ticket(s)? Esta accion no se puede deshacer.`,
      );
      if (!confirmed) return;
    }

    setBulkState({ type: "running", message: "Aplicando accion..." });

    try {
      const response = await fetch("/api/admin/tickets/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: bulkAction,
          status: bulkAction === "set_status" ? bulkStatus : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; affected?: number }
        | null;

      if (!response.ok || !payload?.ok) {
        setBulkState({ type: "error", message: "No se pudo aplicar la accion masiva." });
      } else {
        const affected = payload.affected ?? 0;
        setBulkState({ type: "success", message: `Accion aplicada en ${affected} ticket(s).` });
        setSelectedIds([]);
        router.refresh();
      }
    } catch {
      setBulkState({ type: "error", message: "No se pudo aplicar la accion masiva." });
    }

    if (bulkResetRef.current) clearTimeout(bulkResetRef.current);
    bulkResetRef.current = setTimeout(() => setBulkState({ type: "idle", message: "" }), 2500);
  }

  const columns: AdminColumnDef<TicketRow>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label="Seleccionar todos"
        />
      ),
      widthClassName: "w-12",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.id)}
          onChange={() => setSelectedIds((current) => toggleSelection(current, row.id))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label={`Seleccionar ticket ${row.id}`}
        />
      ),
    },
    {
      key: "issue",
      label: "Ticket",
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm font-medium leading-tight">{row.summary}</p>
          <p className="text-muted-foreground text-xs">{truncate(row.details)}</p>
          <p className="text-muted-foreground font-mono text-[10px]">ID: {row.id}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => statusBadge(row.status),
    },
    {
      key: "severity",
      label: "Severidad",
      render: (row) => severityBadge(row.severity),
      hideOnMobile: true,
    },
    {
      key: "source",
      label: "Origen",
      render: (row) => sourceBadge(row.source),
      hideOnMobile: true,
    },
    {
      key: "report",
      label: "Reportado por",
      render: (row) => (
        <div className="space-y-1">
          <p className="text-xs">{row.email || "sin email"}</p>
          <p className="text-muted-foreground text-[11px]">{row.pageUrl || "sin URL"}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "createdAt",
      label: "Fecha",
      render: (row) => <span className="text-xs">{formatDate(row.createdAtIso)}</span>,
      hideOnMobile: true,
    },
    {
      key: "actions",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <Link
          href={`/admin/tickets/${row.id}`}
          className="inline-flex items-center justify-end gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-muted/45"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Ver
        </Link>
      ),
    },
  ];

  return (
    <>
      <div className="border-b border-border px-3 py-2 sm:px-4">
        <div className="grid gap-2 xl:grid-cols-2">
          <form method="GET" action="/admin/tickets" className="min-w-0" onSubmit={(event) => event.preventDefault()}>
            <AdminFilterPanel
              title={
                <>
                  <Filter className="h-3.5 w-3.5" />
                  Filtros de lista
                </>
              }
              statusSlot={
                <>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <AdminStatusBadge className="capitalize">{filterStateLabel}</AdminStatusBadge>
                </>
              }
              actionSlot={
                <button
                  type="button"
                  onClick={() => void handleCopyFilter()}
                  className={cn(
                    "inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[11px] capitalize",
                    "transition-colors hover:bg-muted/45",
                    copyState === "copied" ? "border-emerald-500/50 text-emerald-300" : "",
                    copyState === "error" ? "border-destructive/60 text-destructive" : "",
                  )}
                >
                  {copyState === "copied" ? "Copiado" : copyState === "error" ? "Error" : "Copiar filtro"}
                </button>
              }
            >
              <AdminControlsRow innerClassName="w-full xl:flex-nowrap">
                <div className="grid min-w-0 flex-[1_1_220px] gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <label className="sr-only" htmlFor="ticket-filter-q">
                      Buscar
                    </label>
                    <input
                      id="ticket-filter-q"
                      type="text"
                      value={localQuery}
                      onChange={(event) => setLocalQuery(event.target.value)}
                      autoComplete="off"
                      placeholder="Buscar por resumen, detalle, email o URL"
                      className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
                    />
                  </div>
                </div>

                <LabeledSelect
                  label="Estado"
                  value={localStatus}
                  onChange={(event) => setLocalStatus(event.target.value)}
                  rootClassName="min-w-[132px] flex-[0_0_132px]"
                  options={[
                    { value: "", label: "TODOS" },
                    { value: "OPEN", label: "OPEN" },
                    { value: "IN_PROGRESS", label: "IN PROGRESS" },
                    { value: "RESOLVED", label: "RESOLVED" },
                    { value: "SPAM", label: "SPAM" },
                  ]}
                />

                <LabeledSelect
                  label="Severidad"
                  value={localSeverity}
                  onChange={(event) => setLocalSeverity(event.target.value)}
                  rootClassName="min-w-[132px] flex-[0_0_132px]"
                  options={[
                    { value: "", label: "TODAS" },
                    { value: "LOW", label: "LOW" },
                    { value: "MEDIUM", label: "MEDIUM" },
                    { value: "HIGH", label: "HIGH" },
                  ]}
                />

                <LabeledSelect
                  label="Origen"
                  value={localSource}
                  onChange={(event) => setLocalSource(event.target.value)}
                  rootClassName="min-w-[148px] flex-[0_0_148px]"
                  options={[
                    { value: "", label: "TODOS" },
                    { value: "NOT_FOUND", label: "404" },
                    { value: "ERROR_PAGE", label: "ERROR PAGE" },
                    { value: "MANUAL", label: "MANUAL" },
                  ]}
                />

                <button
                  type="button"
                  onClick={() => {
                    setLocalQuery("");
                    setLocalStatus("");
                    setLocalSeverity("");
                    setLocalSource("");
                  }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/45"
                  aria-label="Limpiar"
                  title="Limpiar"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              </AdminControlsRow>
            </AdminFilterPanel>
          </form>

          <AdminBulkPanel
            title={
              <>
                <Check className="h-3.5 w-3.5" />
                Acciones masivas
              </>
            }
            statusSlot={<AdminStatusBadge className="capitalize">{selectionStateLabel}</AdminStatusBadge>}
          >
            <AdminControlsRow>
              <label className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))}
                  className="h-4 w-4 rounded border-border bg-background"
                />
                Todo
              </label>

              <LabeledSelect
                label="Accion"
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value as BulkAction)}
                rootClassName="min-w-[150px] flex-[0_0_150px]"
                options={[
                  { value: "set_status", label: "Cambiar estado" },
                  { value: "delete", label: "Eliminar" },
                ]}
              />

              <LabeledSelect
                label="Estado"
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value as BulkStatus)}
                rootClassName="min-w-[160px] flex-[0_0_160px]"
                options={[
                  { value: "OPEN", label: "OPEN" },
                  { value: "IN_PROGRESS", label: "IN PROGRESS" },
                  { value: "RESOLVED", label: "RESOLVED" },
                  { value: "SPAM", label: "SPAM" },
                ]}
                disabled={bulkAction !== "set_status"}
              />

              <button
                type="button"
                onClick={() => void handleBulkApply()}
                disabled={selectedIds.length === 0 || bulkState.type === "running"}
                className="inline-flex h-9 min-w-[124px] items-center justify-center rounded-md border border-border bg-background px-3 text-sm transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkState.type === "running" ? "Aplicando..." : "Aplicar"}
              </button>
            </AdminControlsRow>

            {bulkState.type === "success" ? (
              <p className="mt-2 text-xs text-emerald-300">{bulkState.message}</p>
            ) : null}
            {bulkState.type === "error" ? (
              <p className="mt-2 text-xs text-destructive">{bulkState.message}</p>
            ) : null}
          </AdminBulkPanel>
        </div>
      </div>

      <AdminDataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        rowClassName="border-t border-border/70 hover:bg-muted/60"
        minWidthClassName="min-w-full"
        emptyState={<AdminListEmptyState message="No hay tickets con los filtros actuales." />}
      />
    </>
  );
}
