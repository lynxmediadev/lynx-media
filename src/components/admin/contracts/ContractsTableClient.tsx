"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  Clock3,
  Filter,
  FileCheck2,
  FilePenLine,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { LabeledSelect } from "@/components/admin/ui/LabeledSelect";
import {
  allSelected as computeAllSelected,
  AdminBulkPanel,
  AdminControlsRow,
  AdminDataTable,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListButton,
  AdminListEmptyState,
  AdminStatusBadge,
  countActiveFilters,
  selectAllOrNone,
  toggleSelection,
  type AdminColumnDef,
} from "@/components/admin/list-kit";
import { cn } from "@/lib/utils";

export type ContractRow = {
  id: string;
  contractNumber: string;
  title: string;
  counterpartyName: string;
  counterpartyEmail: string | null;
  status: "DRAFT" | "SENT" | "NEGOTIATION" | "SIGNED" | "EXPIRED" | "CANCELED";
  amount: number | null;
  currency: "CLP" | "USD" | "EUR";
  startsAtIso: string | null;
  endsAtIso: string | null;
  signedAtIso: string | null;
  trackId: string | null;
  requestId: string | null;
  updatedAtIso: string;
};

type BulkActionType = "set_status" | "delete";

type ContractsTableClientProps = {
  rows: ContractRow[];
  filters: {
    q: string;
    status: string;
    per: number;
    activeCount: number;
  };
};

function statusBadge(status: ContractRow["status"]) {
  if (status === "SIGNED") {
    return (
      <AdminIconBadge
        tone="success"
        icon={<ShieldCheck aria-hidden="true" />}
        label="SIGNED"
      />
    );
  }
  if (status === "DRAFT") {
    return (
      <AdminIconBadge
        tone="warning"
        icon={<FilePenLine aria-hidden="true" />}
        label="DRAFT"
      />
    );
  }
  if (status === "SENT") {
    return (
      <AdminIconBadge
        tone="neutral"
        icon={<Send aria-hidden="true" />}
        label="SENT"
      />
    );
  }
  if (status === "NEGOTIATION") {
    return (
      <AdminIconBadge
        tone="warning"
        icon={<Clock3 aria-hidden="true" />}
        label="NEGOTIATION"
      />
    );
  }
  if (status === "EXPIRED") {
    return (
      <AdminIconBadge
        tone="danger"
        icon={<Ban aria-hidden="true" />}
        label="EXPIRED"
      />
    );
  }
  return (
    <AdminIconBadge
      tone="danger"
      icon={<Ban aria-hidden="true" />}
      label="CANCELED"
    />
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatAmount(
  amount: number | null,
  currency: ContractRow["currency"],
) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ContractsTableClient({
  rows,
  filters,
}: ContractsTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionType, setActionType] = useState<BulkActionType>("set_status");
  const [status, setStatus] = useState<ContractRow["status"]>(
    "NEGOTIATION" as ContractRow["status"],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [localQuery, setLocalQuery] = useState(filters.q);
  const [localStatusFilter, setLocalStatusFilter] = useState(filters.status);
  const [localPer, setLocalPer] = useState(String(filters.per));
  const [filterCopyState, setFilterCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const filterCopyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectableIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = computeAllSelected(selectedIds, selectableIds);

  const selectionStateLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} ${selectedIds.length === 1 ? "seleccionado" : "seleccionados"}`
      : "sin selección";
  const localActiveCount = countActiveFilters([
    localQuery.trim().toLowerCase(),
    localStatusFilter,
    localPer !== "20" ? localPer : "",
  ]);
  const filterStateLabel =
    localActiveCount === 0
      ? "sin filtros"
      : `${localActiveCount} ${localActiveCount === 1 ? "filtro activo" : "filtros activos"}`;

  useEffect(() => {
    return () => {
      if (filterCopyResetRef.current) clearTimeout(filterCopyResetRef.current);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();
      const trimmed = localQuery.trim();
      if (trimmed) params.set("q", trimmed);
      if (localStatusFilter) params.set("status", localStatusFilter);
      if (localPer) params.set("per", localPer);
      params.set("page", "1");

      const query = params.toString();
      const nextPath = `${window.location.pathname}?${query}`;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (nextPath !== currentPath) {
        router.replace(nextPath, { scroll: false });
      }
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [localPer, localQuery, localStatusFilter, router]);

  async function handleCopyFilter() {
    const params = new URLSearchParams();
    const trimmed = localQuery.trim();
    if (trimmed) params.set("q", trimmed);
    if (localStatusFilter) params.set("status", localStatusFilter);
    if (localPer) params.set("per", localPer);
    params.set("page", "1");
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setFilterCopyState("copied");
    } catch {
      setFilterCopyState("error");
    }
    if (filterCopyResetRef.current) clearTimeout(filterCopyResetRef.current);
    filterCopyResetRef.current = setTimeout(
      () => setFilterCopyState("idle"),
      1600,
    );
  }

  async function applyBulk() {
    if (selectedIds.length === 0 || isSubmitting) return;
    if (actionType === "delete") {
      const ok = window.confirm(
        `¿Eliminar ${selectedIds.length} contrato(s)? Esta acción no se puede deshacer.`,
      );
      if (!ok) return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/contracts/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: actionType,
          ...(actionType === "set_status" ? { status } : {}),
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        affected?: number;
        error?: unknown;
      } | null;
      if (!res.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "No se pudo aplicar la acción masiva.",
        );
      }

      setSelectedIds([]);
      setFeedback({
        type: "success",
        message: `Acción aplicada (${payload?.affected ?? 0})`,
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error al aplicar acción masiva.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteOne(id: string) {
    const ok = window.confirm(
      "¿Eliminar contrato? Esta acción no se puede deshacer.",
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/admin/contracts/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("No se pudo eliminar.");
      setFeedback({ type: "success", message: "Contrato eliminado" });
      setSelectedIds((current) => current.filter((value) => value !== id));
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Error al eliminar.",
      });
    }
  }

  const desktopColumns: AdminColumnDef<ContractRow>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) =>
            setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))
          }
          className="border-border bg-background h-4 w-4 rounded"
          aria-label="Seleccionar todos los contratos"
        />
      ),
      widthClassName: "w-12",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.id)}
          onChange={() =>
            setSelectedIds((current) => toggleSelection(current, row.id))
          }
          className="border-border bg-background h-4 w-4 rounded"
          aria-label={`Seleccionar contrato ${row.contractNumber}`}
        />
      ),
    },
    {
      key: "contract",
      label: "Contrato",
      render: (row) => (
        <div className="space-y-1">
          <Link
            href={`/admin/contracts/${row.id}`}
            className="text-sm font-medium hover:underline"
          >
            {row.contractNumber}
          </Link>
          <p className="text-muted-foreground text-xs">{row.title}</p>
        </div>
      ),
    },
    {
      key: "counterparty",
      label: "Contraparte",
      render: (row) => (
        <div className="space-y-1 text-xs">
          <p>{row.counterpartyName}</p>
          <p className="text-muted-foreground break-all">
            {row.counterpartyEmail ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => statusBadge(row.status),
    },
    {
      key: "amount",
      label: "Monto",
      render: (row) => (
        <span className="text-xs font-semibold">
          {formatAmount(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: "dates",
      label: "Fechas",
      render: (row) => (
        <div className="text-muted-foreground space-y-1 text-xs">
          <p>Inicio: {formatDate(row.startsAtIso)}</p>
          <p>Fin: {formatDate(row.endsAtIso)}</p>
          <p>Firma: {formatDate(row.signedAtIso)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <AdminListButton asChild size="row">
            <Link href={`/admin/contracts/${row.id}`}>Ver</Link>
          </AdminListButton>
          <AdminListButton
            type="button"
            onClick={() => {
              void deleteOne(row.id);
            }}
            tone="danger"
            size="rowIcon"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </AdminListButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="border-border border-b px-3 py-2 sm:px-4">
        <div className="grid gap-2 xl:grid-cols-2">
          <form
            method="GET"
            action="/admin/contracts"
            className="min-w-0"
            onSubmit={(event) => event.preventDefault()}
          >
            <AdminFilterPanel
              title={
                <>
                  <Filter className="h-3.5 w-3.5" />
                  Filtros de lista
                </>
              }
              statusSlot={
                <>
                  <span className="text-muted-foreground text-[11px]">·</span>
                  <AdminStatusBadge className="capitalize">
                    {filterStateLabel}
                  </AdminStatusBadge>
                </>
              }
              actionSlot={
                <AdminListButton
                  type="button"
                  onClick={() => void handleCopyFilter()}
                  size="pill"
                  surface="background"
                  className={cn(
                    filterCopyState === "copied"
                      ? "border-emerald-500/50 text-emerald-300"
                      : "",
                    filterCopyState === "error"
                      ? "border-destructive/60 text-destructive"
                      : "",
                  )}
                >
                  {filterCopyState === "copied"
                    ? "Copiado"
                    : filterCopyState === "error"
                      ? "Error"
                      : "Copiar filtro"}
                </AdminListButton>
              }
            >
              <AdminControlsRow innerClassName="w-full xl:flex-nowrap">
                <div className="grid min-w-0 flex-[1_1_220px] gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
                    Campo
                  </span>
                  <div className="relative w-full">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <input
                      id="filter-contracts-q"
                      type="text"
                      name="q"
                      value={localQuery}
                      onChange={(event) => setLocalQuery(event.target.value)}
                      placeholder="Buscar # contrato, título o contraparte"
                      className="border-border bg-background h-9 w-full rounded-md border pr-3 pl-9 text-sm"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <LabeledSelect
                  rootClassName="w-[144px]"
                  label="ESTADO"
                  labelPosition="top"
                  id="filter-contracts-status"
                  name="status"
                  value={localStatusFilter}
                  onChange={(event) => setLocalStatusFilter(event.target.value)}
                  className="h-9 w-full"
                  options={[
                    { value: "", label: "TODOS" },
                    { value: "DRAFT", label: "DRAFT" },
                    { value: "SENT", label: "SENT" },
                    { value: "NEGOTIATION", label: "NEGOTIATION" },
                    { value: "SIGNED", label: "SIGNED" },
                    { value: "EXPIRED", label: "EXPIRED" },
                    { value: "CANCELED", label: "CANCELED" },
                  ]}
                />

                <LabeledSelect
                  rootClassName="w-[104px]"
                  label="POR PÁGINA"
                  labelPosition="top"
                  id="filter-contracts-per"
                  name="per"
                  value={localPer}
                  onChange={(event) => setLocalPer(event.target.value)}
                  className="h-9 w-full"
                  options={[
                    { value: "10", label: "10" },
                    { value: "20", label: "20" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                />

                <div className="grid w-[42px] gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
                    Acción
                  </span>
                  <AdminListButton
                    id="contracts-limpiar-filtros"
                    type="button"
                    title="Limpiar"
                    aria-label="Limpiar"
                    onClick={() => {
                      setLocalQuery("");
                      setLocalStatusFilter("");
                      setLocalPer("20");
                    }}
                    size="controlIcon"
                    className="w-full"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </AdminListButton>
                </div>
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
            statusSlot={
              <div className="inline-flex items-center gap-1.5">
                <AdminStatusBadge className="capitalize">
                  {selectionStateLabel}
                </AdminStatusBadge>
                {feedback ? (
                  <AdminStatusBadge
                    tone={feedback.type === "success" ? "success" : "danger"}
                  >
                    {feedback.message}
                  </AdminStatusBadge>
                ) : null}
              </div>
            }
            className="bg-background/30"
          >
            <AdminControlsRow>
              <div className="grid gap-1">
                <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
                  Campo
                </span>
                <label className="border-border inline-flex h-8 items-center gap-2 rounded-md border px-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) =>
                      setSelectedIds(
                        selectAllOrNone(selectableIds, event.target.checked),
                      )
                    }
                    className="border-border bg-background h-4 w-4 rounded"
                  />
                  Todo
                </label>
              </div>

              <LabeledSelect
                rootClassName="w-[160px]"
                label="ACCIÓN"
                labelPosition="top"
                value={actionType}
                onChange={(event) =>
                  setActionType(event.target.value as BulkActionType)
                }
                className="h-8 w-full"
                options={[
                  { value: "set_status", label: "Cambiar estado" },
                  { value: "delete", label: "Eliminar" },
                ]}
              />

              {actionType === "set_status" ? (
                <LabeledSelect
                  rootClassName="w-[170px]"
                  label="ESTADO"
                  labelPosition="top"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ContractRow["status"])
                  }
                  className="h-8 w-full"
                  options={[
                    { value: "DRAFT", label: "DRAFT" },
                    { value: "SENT", label: "SENT" },
                    { value: "NEGOTIATION", label: "NEGOTIATION" },
                    { value: "SIGNED", label: "SIGNED" },
                    { value: "EXPIRED", label: "EXPIRED" },
                    { value: "CANCELED", label: "CANCELED" },
                  ]}
                />
              ) : (
                <div className="grid gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
                    Campo
                  </span>
                  <p className="text-destructive h-8 pt-2 text-xs">
                    Acción destructiva.
                  </p>
                </div>
              )}

              <div className="grid gap-1">
                <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
                  Campo
                </span>
                <AdminListButton
                  type="button"
                  disabled={selectedIds.length === 0 || isSubmitting}
                  onClick={() => {
                    void applyBulk();
                  }}
                  size="row"
                  className="gap-1 text-sm"
                >
                  <Check className="h-4 w-4" />
                  Aplicar
                </AdminListButton>
              </div>

              <div className="grid gap-1">
                <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
                  Campo
                </span>
                <AdminListButton
                  type="button"
                  onClick={() => setSelectedIds([])}
                  disabled={selectedIds.length === 0}
                  size="rowIcon"
                  title="Limpiar selección"
                >
                  <RefreshCcw className="h-4 w-4" />
                </AdminListButton>
              </div>
            </AdminControlsRow>
          </AdminBulkPanel>
        </div>
      </div>

      {rows.length === 0 ? (
        <AdminListEmptyState
          message="No hay contratos registrados todavía."
          className="py-10"
        />
      ) : (
        <>
          <div className="space-y-3 p-3 md:hidden">
            {rows.map((row) => (
              <article
                key={row.id}
                className={cn(
                  "border-border/70 bg-card space-y-3 rounded-lg border p-3 transition-colors",
                  selectedSet.has(row.id) ? "bg-accent/20" : "",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {row.contractNumber}
                    </p>
                    <p className="text-muted-foreground text-xs">{row.title}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(row.id)}
                    onChange={() =>
                      setSelectedIds((current) =>
                        toggleSelection(current, row.id),
                      )
                    }
                    className="border-border bg-background mt-0.5 h-4 w-4 rounded"
                    aria-label={`Seleccionar contrato ${row.contractNumber}`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(row.status)}
                  <AdminStatusBadge>
                    {formatAmount(row.amount, row.currency)}
                  </AdminStatusBadge>
                </div>

                <div className="text-muted-foreground space-y-1 text-xs">
                  <p>{row.counterpartyName}</p>
                  <p className="break-all">{row.counterpartyEmail ?? "—"}</p>
                </div>

                <div className="border-border/60 grid grid-cols-2 gap-2 border-t pt-2">
                  <AdminListButton asChild size="row" className="gap-1">
                    <Link href={`/admin/contracts/${row.id}`}>
                      <FileCheck2 className="mr-1 h-3.5 w-3.5" />
                      Ver detalle
                    </Link>
                  </AdminListButton>
                  <AdminListButton
                    type="button"
                    onClick={() => {
                      void deleteOne(row.id);
                    }}
                    tone="danger"
                    size="row"
                    className="gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </AdminListButton>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden md:block">
            <AdminDataTable
              rows={rows}
              columns={desktopColumns}
              rowKey={(row) => row.id}
              rowClassName={(row) =>
                cn(
                  "border-t border-border/70 hover:bg-muted/60",
                  selectedSet.has(row.id) && "bg-accent/20 hover:bg-accent/25",
                )
              }
              tableClassName="w-full table-fixed"
              headerClassName="bg-muted/60"
            />
          </div>
        </>
      )}
    </>
  );
}
