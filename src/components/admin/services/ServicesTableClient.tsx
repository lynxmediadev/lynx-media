"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Check,
  Clock3,
  Copy,
  Filter,
  RefreshCcw,
  Search,
  ShieldCheck,
  Star,
  Timer,
  Trash2,
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

export type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  category: "MIX_MASTER" | "PRODUCTION" | "COMPOSITION" | "SOUND_DESIGN" | "OTHER";
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  priceFrom: number | null;
  priceTo: number | null;
  currency: "CLP" | "USD" | "EUR";
  turnaroundDays: number | null;
  featured: boolean;
  sortOrder: number;
  updatedAtIso: string;
};

type BulkActionType = "set_status" | "set_featured" | "delete";

type ServicesTableClientProps = {
  rows: ServiceRow[];
  filters: {
    q: string;
    status: string;
    category: string;
    per: number;
    activeCount: number;
  };
};

function statusBadge(status: ServiceRow["status"]) {
  if (status === "ACTIVE") {
    return <AdminIconBadge tone="success" icon={<ShieldCheck aria-hidden="true" />} label="ACTIVE" />;
  }
  if (status === "PAUSED") {
    return <AdminIconBadge tone="warning" icon={<Clock3 aria-hidden="true" />} label="PAUSED" />;
  }
  return <AdminIconBadge tone="danger" icon={<Archive aria-hidden="true" />} label="ARCHIVED" />;
}

function categoryLabel(category: ServiceRow["category"]) {
  switch (category) {
    case "MIX_MASTER":
      return "Mix/Master";
    case "PRODUCTION":
      return "Production";
    case "COMPOSITION":
      return "Composition";
    case "SOUND_DESIGN":
      return "Sound Design";
    default:
      return "Other";
  }
}

function categoryBadge(category: ServiceRow["category"]) {
  return <AdminIconBadge tone="neutral" icon={<Wrench aria-hidden="true" />} label={categoryLabel(category).toUpperCase()} />;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatPriceRange(row: ServiceRow) {
  const formatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: row.currency,
    maximumFractionDigits: 0,
  });
  if (row.priceFrom == null && row.priceTo == null) return "—";
  if (row.priceFrom != null && row.priceTo != null) {
    return `${formatter.format(row.priceFrom)} - ${formatter.format(row.priceTo)}`;
  }
  if (row.priceFrom != null) return `Desde ${formatter.format(row.priceFrom)}`;
  return `Hasta ${formatter.format(row.priceTo ?? 0)}`;
}

export function ServicesTableClient({ rows, filters }: ServicesTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionType, setActionType] = useState<BulkActionType>("set_status");
  const [status, setStatus] = useState<ServiceRow["status"]>("ACTIVE");
  const [featured, setFeatured] = useState<"true" | "false">("true");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [localQuery, setLocalQuery] = useState(filters.q);
  const [localCategoryFilter, setLocalCategoryFilter] = useState(filters.category);
  const [localStatusFilter, setLocalStatusFilter] = useState(filters.status);
  const [localPer, setLocalPer] = useState(String(filters.per));
  const [filterCopyState, setFilterCopyState] = useState<"idle" | "copied" | "error">("idle");
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
    localCategoryFilter,
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
      if (localCategoryFilter) params.set("category", localCategoryFilter);
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
  }, [localCategoryFilter, localPer, localQuery, localStatusFilter, router]);

  async function handleCopyFilter() {
    const params = new URLSearchParams();
    const trimmed = localQuery.trim();
    if (trimmed) params.set("q", trimmed);
    if (localCategoryFilter) params.set("category", localCategoryFilter);
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
    filterCopyResetRef.current = setTimeout(() => setFilterCopyState("idle"), 1600);
  }

  async function applyBulk() {
    if (selectedIds.length === 0 || isSubmitting) return;
    if (actionType === "delete") {
      const ok = window.confirm(`¿Eliminar ${selectedIds.length} servicio(s)? Esta acción no se puede deshacer.`);
      if (!ok) return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/services/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: actionType,
          ...(actionType === "set_status" ? { status } : {}),
          ...(actionType === "set_featured" ? { featured: featured === "true" } : {}),
        }),
      });
      const payload = (await res.json().catch(() => null)) as { affected?: number; error?: unknown } | null;
      if (!res.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "No se pudo aplicar la acción masiva.");
      }

      setSelectedIds([]);
      setFeedback({ type: "success", message: `Acción aplicada (${payload?.affected ?? 0})` });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Error al aplicar acción masiva.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteOne(id: string) {
    const ok = window.confirm("¿Eliminar servicio? Esta acción no se puede deshacer.");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/services/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar.");
      setFeedback({ type: "success", message: "Servicio eliminado" });
      setSelectedIds((current) => current.filter((value) => value !== id));
      router.refresh();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Error al eliminar." });
    }
  }

  const desktopColumns: AdminColumnDef<ServiceRow>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label="Seleccionar todos los servicios"
        />
      ),
      widthClassName: "w-12",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.id)}
          onChange={() => setSelectedIds((current) => toggleSelection(current, row.id))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label={`Seleccionar servicio ${row.name}`}
        />
      ),
    },
    {
      key: "name",
      label: "Servicio",
      render: (row) => (
        <div className="space-y-1">
          <Link href={`/admin/services/${row.id}`} className="text-sm font-medium hover:underline">
            {row.name}
          </Link>
          <p className="font-mono text-[11px] break-all text-muted-foreground">{row.slug}</p>
        </div>
      ),
    },
    { key: "category", label: "Categoría", render: (row) => categoryBadge(row.category) },
    { key: "status", label: "Estado", render: (row) => statusBadge(row.status) },
    {
      key: "featured",
      label: "Destacado",
      render: (row) => (
        <AdminIconBadge
          tone={row.featured ? "success" : "neutral"}
          icon={<Star aria-hidden="true" />}
          label={row.featured ? "FEATURED" : "NORMAL"}
        />
      ),
    },
    {
      key: "price",
      label: "Precio",
      render: (row) => <span className="text-xs font-semibold">{formatPriceRange(row)}</span>,
    },
    {
      key: "turnaround",
      label: "Turnaround",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          {row.turnaroundDays != null ? `${row.turnaroundDays} días` : "—"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      render: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.updatedAtIso)}</span>,
    },
    {
      key: "actions",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/services/${row.id}`}
            className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
          >
            Ver
          </Link>
          <button
            type="button"
            onClick={() => {
              void deleteOne(row.id);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/60 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="border-b border-border px-3 py-2 sm:px-4">
        <div className="grid gap-2 xl:grid-cols-2">
          <form method="GET" action="/admin/services" className="min-w-0" onSubmit={(event) => event.preventDefault()}>
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
                    filterCopyState === "copied" ? "border-emerald-500/50 text-emerald-300" : "",
                    filterCopyState === "error" ? "border-destructive/60 text-destructive" : "",
                  )}
                >
                  {filterCopyState === "copied" ? (
                    <>
                      <Copy className="h-3 w-3" />
                      Copiado
                    </>
                  ) : filterCopyState === "error" ? (
                    "Error"
                  ) : (
                    "Copiar filtro"
                  )}
                </button>
              }
            >
              <AdminControlsRow innerClassName="w-full xl:flex-nowrap">
                <div className="grid min-w-0 flex-[1_1_220px] gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="filter-services-q"
                      type="text"
                      name="q"
                      value={localQuery}
                      onChange={(event) => setLocalQuery(event.target.value)}
                      placeholder="Buscar nombre o slug"
                      className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <LabeledSelect
                  rootClassName="w-[140px]"
                  label="CATEGORÍA"
                  labelPosition="top"
                  id="filter-services-category"
                  name="category"
                  value={localCategoryFilter}
                  onChange={(event) => setLocalCategoryFilter(event.target.value)}
                  className="h-9 w-full"
                  options={[
                    { value: "", label: "TODAS" },
                    { value: "MIX_MASTER", label: "MIX_MASTER" },
                    { value: "PRODUCTION", label: "PRODUCTION" },
                    { value: "COMPOSITION", label: "COMPOSITION" },
                    { value: "SOUND_DESIGN", label: "SOUND_DESIGN" },
                    { value: "OTHER", label: "OTHER" },
                  ]}
                />

                <LabeledSelect
                  rootClassName="w-[124px]"
                  label="ESTADO"
                  labelPosition="top"
                  id="filter-services-status"
                  name="status"
                  value={localStatusFilter}
                  onChange={(event) => setLocalStatusFilter(event.target.value)}
                  className="h-9 w-full"
                  options={[
                    { value: "", label: "TODOS" },
                    { value: "ACTIVE", label: "ACTIVE" },
                    { value: "PAUSED", label: "PAUSED" },
                    { value: "ARCHIVED", label: "ARCHIVED" },
                  ]}
                />

                <LabeledSelect
                  rootClassName="w-[104px]"
                  label="POR PÁGINA"
                  labelPosition="top"
                  id="filter-services-per"
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
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                    Acción
                  </span>
                  <button
                    id="services-limpiar-filtros"
                    type="button"
                    title="Limpiar"
                    aria-label="Limpiar"
                    onClick={() => {
                      setLocalQuery("");
                      setLocalCategoryFilter("");
                      setLocalStatusFilter("");
                      setLocalPer("20");
                    }}
                    className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-muted/45"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
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
                <AdminStatusBadge className="capitalize">{selectionStateLabel}</AdminStatusBadge>
                {feedback ? (
                  <AdminStatusBadge tone={feedback.type === "success" ? "success" : "danger"}>
                    {feedback.message}
                  </AdminStatusBadge>
                ) : null}
              </div>
            }
            className="bg-background/30"
          >
            <AdminControlsRow>
              <div className="grid gap-1">
                <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                <label className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))}
                    className="h-4 w-4 rounded border-border bg-background"
                  />
                  Todo
                </label>
              </div>

              <LabeledSelect
                rootClassName="w-[160px]"
                label="ACCIÓN"
                labelPosition="top"
                value={actionType}
                onChange={(event) => setActionType(event.target.value as BulkActionType)}
                className="h-8 w-full"
                options={[
                  { value: "set_status", label: "Cambiar estado" },
                  { value: "set_featured", label: "Cambiar destacado" },
                  { value: "delete", label: "Eliminar" },
                ]}
              />

              {actionType === "set_status" ? (
                <LabeledSelect
                  rootClassName="w-[150px]"
                  label="ESTADO"
                  labelPosition="top"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ServiceRow["status"])}
                  className="h-8 w-full"
                  options={[
                    { value: "ACTIVE", label: "ACTIVE" },
                    { value: "PAUSED", label: "PAUSED" },
                    { value: "ARCHIVED", label: "ARCHIVED" },
                  ]}
                />
              ) : actionType === "set_featured" ? (
                <LabeledSelect
                  rootClassName="w-[160px]"
                  label="DESTACADO"
                  labelPosition="top"
                  value={featured}
                  onChange={(event) => setFeatured(event.target.value as "true" | "false")}
                  className="h-8 w-full"
                  options={[
                    { value: "true", label: "FEATURED" },
                    { value: "false", label: "NORMAL" },
                  ]}
                />
              ) : (
                <div className="grid gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                  <p className="h-8 pt-2 text-xs text-destructive">Acción destructiva.</p>
                </div>
              )}

              <div className="grid gap-1">
                <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                <button
                  type="button"
                  disabled={selectedIds.length === 0 || isSubmitting}
                  onClick={() => {
                    void applyBulk();
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-sm transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Aplicar
                </button>
              </div>

              <div className="grid gap-1">
                <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  disabled={selectedIds.length === 0}
                  className="inline-flex h-8 items-center rounded-md border border-border px-2 text-xs transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Limpiar selección"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </AdminControlsRow>
          </AdminBulkPanel>
        </div>
      </div>

      {rows.length === 0 ? (
        <AdminListEmptyState message="No hay servicios registrados todavía." className="py-10" />
      ) : (
        <>
          <div className="space-y-3 p-3 md:hidden">
            {rows.map((row) => (
              <article
                key={row.id}
                className={cn(
                  "space-y-3 rounded-lg border border-border/70 bg-card p-3 transition-colors",
                  selectedSet.has(row.id) ? "bg-accent/20" : "",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.name}</p>
                    <p className="font-mono text-[11px] break-all text-muted-foreground">{row.slug}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(row.id)}
                    onChange={() => setSelectedIds((current) => toggleSelection(current, row.id))}
                    className="mt-0.5 h-4 w-4 rounded border-border bg-background"
                    aria-label={`Seleccionar servicio ${row.name}`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(row.status)}
                  {categoryBadge(row.category)}
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatPriceRange(row)} · {row.turnaroundDays != null ? `${row.turnaroundDays} días` : "sin turnaround"}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2">
                  <Link
                    href={`/admin/services/${row.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
                  >
                    Ver detalle
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteOne(row.id);
                    }}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-destructive/60 bg-destructive/10 px-2.5 text-xs text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
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
