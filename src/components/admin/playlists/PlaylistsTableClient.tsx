"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  RefreshCcw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Plus,
} from "lucide-react";
import { LabeledSelect } from "@/components/admin/ui/LabeledSelect";
import {
  allSelected as computeAllSelected,
  AdminBulkPanel,
  AdminControlsRow,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListButton,
  AdminListEmptyState,
  AdminStatusBadge,
  ListKitTableComposer,
  countActiveFilters,
  selectAllOrNone,
  toggleSelection,
  type AdminColumnDef,
} from "@/components/admin/list-kit";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";

export type PlaylistRow = {
  id: string;
  name: string;
  publicId: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PRIVATE" | "INTERNAL" | "PUBLIC";
  embedEnabled: boolean;
  isMainCatalog: boolean;
  isAutoAllTracks: boolean;
  featured: boolean;
  sortOrder: number;
  trackCount: number;
  updatedAtIso: string;
};

type BulkActionType =
  | "set_status"
  | "set_visibility"
  | "set_featured"
  | "delete";

type PlaylistsTableClientProps = {
  rows: PlaylistRow[];
  filters: {
    q: string;
    status: string;
    visibility: string;
    per: number;
    activeCount: number;
  };
  allowBulk?: boolean;
  basePath?: string;
  allowCreate?: boolean;
};

function statusBadge(status: PlaylistRow["status"]) {
  if (status === "PUBLISHED") {
    return (
      <AdminIconBadge
        tone="success"
        icon={<ShieldCheck aria-hidden="true" />}
        label="PUBLISHED"
      />
    );
  }
  if (status === "ARCHIVED") {
    return (
      <AdminIconBadge
        tone="danger"
        icon={<Archive aria-hidden="true" />}
        label="ARCHIVED"
      />
    );
  }
  return (
    <AdminIconBadge
      tone="warning"
      icon={<Clock3 aria-hidden="true" />}
      label="DRAFT"
    />
  );
}

function visibilityBadge(visibility: PlaylistRow["visibility"]) {
  if (visibility === "PUBLIC") {
    return (
      <AdminIconBadge
        tone="success"
        icon={<Eye aria-hidden="true" />}
        label="PUBLIC"
      />
    );
  }
  if (visibility === "PRIVATE") {
    return (
      <AdminIconBadge
        tone="danger"
        icon={<EyeOff aria-hidden="true" />}
        label="PRIVATE"
      />
    );
  }
  return (
    <AdminIconBadge
      tone="neutral"
      icon={<Eye aria-hidden="true" />}
      label="INTERNAL"
    />
  );
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

export function PlaylistsTableClient({
  rows,
  filters,
  allowBulk = true,
  basePath = "/admin/playlists",
  allowCreate = true,
}: PlaylistsTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionType, setActionType] = useState<BulkActionType>("set_status");
  const [status, setStatus] = useState<PlaylistRow["status"]>("PUBLISHED");
  const [visibility, setVisibility] =
    useState<PlaylistRow["visibility"]>("INTERNAL");
  const [featured, setFeatured] = useState<"true" | "false">("true");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [localQuery, setLocalQuery] = useState(filters.q);
  const [localStatusFilter, setLocalStatusFilter] = useState(filters.status);
  const [localVisibilityFilter, setLocalVisibilityFilter] = useState(
    filters.visibility,
  );
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
    localVisibilityFilter,
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
      if (localVisibilityFilter)
        params.set("visibility", localVisibilityFilter);
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
  }, [localPer, localQuery, localStatusFilter, localVisibilityFilter, router]);

  async function handleCopyFilter() {
    const params = new URLSearchParams();
    const trimmed = localQuery.trim();
    if (trimmed) params.set("q", trimmed);
    if (localStatusFilter) params.set("status", localStatusFilter);
    if (localVisibilityFilter) params.set("visibility", localVisibilityFilter);
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
        `¿Eliminar ${selectedIds.length} playlist(s)? Esta acción no se puede deshacer.`,
      );
      if (!ok) return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/playlists/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: actionType,
          ...(actionType === "set_status" ? { status } : {}),
          ...(actionType === "set_visibility" ? { visibility } : {}),
          ...(actionType === "set_featured"
            ? { featured: featured === "true" }
            : {}),
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

  async function createPlaylist() {
    if (!allowCreate) return;
    const name = window.prompt("Nombre de playlist");
    if (!name || !name.trim()) return;
    const suggestedSlug = slugify(name.trim());
    const slug = window.prompt("Slug", suggestedSlug || "");
    if (!slug || !slug.trim()) return;

    try {
      const res = await fetch("/api/admin/playlists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugify(slug.trim()),
          status: "DRAFT",
          visibility: "INTERNAL",
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.error || "No se pudo crear playlist.");
      }
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No se pudo crear playlist.",
      });
    }
  }

  async function deleteOne(id: string) {
    const ok = window.confirm(
      "¿Eliminar playlist? Esta acción no se puede deshacer.",
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/admin/playlists/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("No se pudo eliminar.");
      setFeedback({ type: "success", message: "Playlist eliminada" });
      setSelectedIds((current) => current.filter((value) => value !== id));
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Error al eliminar.",
      });
    }
  }

  const desktopColumns: AdminColumnDef<PlaylistRow>[] = [
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
          aria-label="Seleccionar todas las playlists"
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
          aria-label={`Seleccionar playlist ${row.name}`}
        />
      ),
    },
    {
      key: "name",
      label: "Playlist",
      render: (row) => (
        <div className="space-y-1">
          <Link
            href={`${basePath}/${row.id}`}
            className="text-sm font-medium hover:underline"
          >
            {row.name}
          </Link>
          <div className="text-muted-foreground font-mono text-[11px]">
            <p className="break-all">slug: {row.slug}</p>
            <p className="break-all">public: {row.publicId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (row) => statusBadge(row.status),
    },
    {
      key: "visibility",
      label: "Visibilidad",
      render: (row) => visibilityBadge(row.visibility),
    },
    {
      key: "featured",
      label: "Flags",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          <AdminIconBadge
            tone={row.featured ? "success" : "neutral"}
            icon={<Star aria-hidden="true" />}
            label={row.featured ? "FEATURED" : "NORMAL"}
          />
          {row.isMainCatalog ? (
            <AdminStatusBadge tone="success">MAIN CATALOG</AdminStatusBadge>
          ) : null}
          {row.isAutoAllTracks ? (
            <AdminStatusBadge tone="info">ALL TRACKS</AdminStatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      key: "tracks",
      label: "Tracks",
      align: "center",
      render: (row) => <AdminStatusBadge>{row.trackCount}</AdminStatusBadge>,
    },
    {
      key: "sortOrder",
      label: "Orden",
      align: "center",
      render: (row) => (
        <span className="text-muted-foreground text-xs">{row.sortOrder}</span>
      ),
    },
    {
      key: "updatedAt",
      label: "Actualizada",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {formatDate(row.updatedAtIso)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <AdminListButton asChild size="row">
            <Link href={`${basePath}/${row.id}`}>Ver</Link>
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

  const filterPanel = (
    <form
      method="GET"
      action={basePath}
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
          <div className="flex items-center gap-2">
            {allowCreate ? (
              <AdminListButton
                type="button"
                onClick={() => {
                  void createPlaylist();
                }}
                size="pill"
                surface="background"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva
              </AdminListButton>
            ) : null}
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
          </div>
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
                id="filter-playlists-q"
                type="text"
                name="q"
                value={localQuery}
                onChange={(event) => setLocalQuery(event.target.value)}
                placeholder="Buscar nombre o slug"
                className="border-border bg-background h-9 w-full rounded-md border pr-3 pl-9 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <LabeledSelect
            rootClassName="w-[130px]"
            label="ESTADO"
            labelPosition="top"
            id="filter-playlists-status"
            name="status"
            value={localStatusFilter}
            onChange={(event) => setLocalStatusFilter(event.target.value)}
            className="h-9 w-full"
            options={[
              { value: "", label: "TODOS" },
              { value: "DRAFT", label: "DRAFT" },
              { value: "PUBLISHED", label: "PUBLISHED" },
              { value: "ARCHIVED", label: "ARCHIVED" },
            ]}
          />

          <LabeledSelect
            rootClassName="w-[130px]"
            label="VISIBILIDAD"
            labelPosition="top"
            id="filter-playlists-visibility"
            name="visibility"
            value={localVisibilityFilter}
            onChange={(event) => setLocalVisibilityFilter(event.target.value)}
            className="h-9 w-full"
            options={[
              { value: "", label: "TODOS" },
              { value: "PRIVATE", label: "PRIVATE" },
              { value: "INTERNAL", label: "INTERNAL" },
              { value: "PUBLIC", label: "PUBLIC" },
            ]}
          />

          <LabeledSelect
            rootClassName="w-[104px]"
            label="POR PÁGINA"
            labelPosition="top"
            id="filter-playlists-per"
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
              id="playlists-limpiar-filtros"
              type="button"
              title="Limpiar"
              aria-label="Limpiar"
              onClick={() => {
                setLocalQuery("");
                setLocalStatusFilter("");
                setLocalVisibilityFilter("");
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
  );

  const bulkPanel = allowBulk ? (
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
          onChange={(event) => setActionType(event.target.value as BulkActionType)}
          className="h-8 w-full"
          options={[
            { value: "set_status", label: "Cambiar estado" },
            { value: "set_visibility", label: "Cambiar visibilidad" },
            { value: "set_featured", label: "Cambiar destacada" },
            { value: "delete", label: "Eliminar" },
          ]}
        />

        {actionType === "set_status" ? (
          <LabeledSelect
            rootClassName="w-[160px]"
            label="ESTADO"
            labelPosition="top"
            value={status}
            onChange={(event) => setStatus(event.target.value as PlaylistRow["status"])}
            className="h-8 w-full"
            options={[
              { value: "DRAFT", label: "DRAFT" },
              { value: "PUBLISHED", label: "PUBLISHED" },
              { value: "ARCHIVED", label: "ARCHIVED" },
            ]}
          />
        ) : actionType === "set_visibility" ? (
          <LabeledSelect
            rootClassName="w-[170px]"
            label="VISIBILIDAD"
            labelPosition="top"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as PlaylistRow["visibility"])}
            className="h-8 w-full"
            options={[
              { value: "PRIVATE", label: "PRIVATE" },
              { value: "INTERNAL", label: "INTERNAL" },
              { value: "PUBLIC", label: "PUBLIC" },
            ]}
          />
        ) : actionType === "set_featured" ? (
          <LabeledSelect
            rootClassName="w-[160px]"
            label="DESTACADA"
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
            <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
              Campo
            </span>
            <p className="text-destructive h-8 pt-2 text-xs">Acción destructiva.</p>
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
  ) : undefined;

  const emptyState = (
    <AdminListEmptyState
      message="No hay playlists registradas todavía."
      className="py-10"
    />
  );

  return (
    <ListKitTableComposer
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
      filterPanel={filterPanel}
      bulkPanel={bulkPanel}
      emptyState={emptyState}
      renderMobileRow={(row) => (
        <article
          key={row.id}
          className={cn(
            "border-border/70 bg-card space-y-3 rounded-lg border p-3 transition-colors",
            selectedSet.has(row.id) ? "bg-accent/20" : "",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.name}</p>
              <div className="text-muted-foreground font-mono text-[11px]">
                <p className="break-all">slug: {row.slug}</p>
                <p className="break-all">public: {row.publicId}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={selectedSet.has(row.id)}
              onChange={() =>
                setSelectedIds((current) => toggleSelection(current, row.id))
              }
              className="border-border bg-background mt-0.5 h-4 w-4 rounded"
              aria-label={`Seleccionar playlist ${row.name}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(row.status)}
            {visibilityBadge(row.visibility)}
            <AdminStatusBadge>{row.trackCount} tracks</AdminStatusBadge>
            {row.isMainCatalog ? (
              <AdminStatusBadge tone="success">MAIN</AdminStatusBadge>
            ) : null}
            {row.isAutoAllTracks ? (
              <AdminStatusBadge tone="info">ALL TRACKS</AdminStatusBadge>
            ) : null}
          </div>

          <div className="text-muted-foreground text-xs">
            Orden: {row.sortOrder} · Actualizada: {formatDate(row.updatedAtIso)}
          </div>

          <div className="border-border/60 grid grid-cols-2 gap-2 border-t pt-2">
            <AdminListButton asChild size="row">
              <Link href={`${basePath}/${row.id}`}>Ver detalle</Link>
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
      )}
    />
  );
}
