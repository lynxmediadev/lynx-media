"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Ban,
  Check,
  Clock3,
  FileText,
  RefreshCw,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  allSelected as computeAllSelected,
  AdminBulkPanel,
  AdminControlsRow,
  AdminDataTable,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListEmptyState,
  AdminListHeader,
  AdminListShell,
  AdminStatusBadge,
  buildFilterQueryString,
  countActiveFilters,
  selectAllOrNone,
  toggleSelection,
  type AdminColumnDef,
} from "@/components/admin/list-kit";
import { LabeledSelect } from "@/components/admin/ui/LabeledSelect";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  email: string;
  serviceType: string;
  status: string;
  urgency: number;
  details: string | null;
  pageUrl: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  deadlineAt: number | null;
  rawPayload: unknown;
};

function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function shortUrl(url?: string | null) {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return u.host || url;
  } catch {
    return url.slice(0, 80);
  }
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Tooltip open={copied}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => {
            void copy();
          }}
          className="text-xs text-muted-foreground break-all"
          aria-live="polite"
        >
          {email}
        </button>
      </TooltipTrigger>
      <TooltipContent className="px-2 py-1 text-xs leading-none">Copiado</TooltipContent>
    </Tooltip>
  );
}

function buildMixMeta(row: Row) {
  const payload = row.rawPayload as Record<string, any> | null;
  if (!payload) return null;
  const projectType = payload.projectType === "album" ? "Álbum" : "Single";
  let tracksCount: string | null = null;
  const parts: string[] = [];
  if (payload.projectType === "single" && payload.single) {
    if (typeof payload.single.tracks === "number") {
      tracksCount = String(payload.single.tracks);
    }
    if (payload.single.drumQuantize) parts.push("Bat");
    if (typeof payload.single.vocalTracks === "number" && payload.single.vocalTracks > 0) {
      parts.push(`V${payload.single.vocalTracks}`);
    }
    const addons = payload.single.addons || {};
    if (addons.acapella) parts.push("Acapella");
    if (addons.instrumental) parts.push("Instrumental");
    if (addons.liveBacking) parts.push("Live");
    if (addons.rush) parts.push("Rush");
    if (addons.unlimitedRevs) parts.push("Revs");
  }
  if (payload.projectType === "album" && payload.album) {
    if (typeof payload.album.songs === "number") {
      tracksCount = String(payload.album.songs);
    }
    if (payload.album.timeline) parts.push(payload.album.timeline);
  }
  return { projectType, meta: parts, tracksCount };
}

function formatPrice(row: Row) {
  const payload = row.rawPayload as Record<string, any> | null;
  if (!payload || !payload.single || payload.projectType !== "single") return "—";
  const totalClp = payload.single.pricingClp;
  if (typeof totalClp !== "number") return "—";
  const currency = payload.currency || "CLP";
  const formatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(totalClp);
}

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (status === "NEW") return "warning";
  if (status === "CLOSED_WON") return "success";
  if (status === "CLOSED_LOST") return "danger";
  return "neutral";
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");
  if (status === "NEW") {
    return <AdminIconBadge tone="warning" icon={<Clock3 aria-hidden="true" />} label={label} />;
  }
  if (status === "IN_REVIEW") {
    return <AdminIconBadge tone="neutral" icon={<Search aria-hidden="true" />} label={label} />;
  }
  if (status === "QUOTED") {
    return <AdminIconBadge tone="neutral" icon={<FileText aria-hidden="true" />} label={label} />;
  }
  if (status === "CLOSED_WON") {
    return <AdminIconBadge tone="success" icon={<ShieldCheck aria-hidden="true" />} label={label} />;
  }
  if (status === "CLOSED_LOST") {
    return <AdminIconBadge tone="danger" icon={<Ban aria-hidden="true" />} label={label} />;
  }
  return <AdminIconBadge tone={statusTone(status)} icon={<FileText aria-hidden="true" />} label={label} />;
}

function UrgencyBadge({ value }: { value: number }) {
  const tone = value >= 4 ? "danger" : value >= 3 ? "warning" : "neutral";
  return <AdminStatusBadge tone={tone}>U{Number.isFinite(value) ? value : "—"}</AdminStatusBadge>;
}

function projectSummary(row: Row) {
  const mix = buildMixMeta(row);
  if (!mix) return "—";
  return `${mix.projectType} · ${mix.tracksCount ?? "—"}`;
}

function metadataSummary(row: Row) {
  const mix = buildMixMeta(row);
  const meta = mix?.meta?.length ? mix.meta.join(" · ") : "—";
  return `${meta} · ${shortUrl(row.pageUrl)}`;
}

export default function RequestsAdminClient(props: {
  rows: Row[];
  total: number;
  statusOptions: string[];
  serviceOptions: string[];
  initialQS: {
    q: string;
    status: string;
    serviceType: string;
    projectType: string;
    page: number;
    per: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = React.useState(props.initialQS.q ?? "");
  const [status, setStatus] = React.useState(props.initialQS.status ?? "");
  const [serviceType, setServiceType] = React.useState(props.initialQS.serviceType ?? "");
  const [projectType, setProjectType] = React.useState(props.initialQS.projectType ?? "");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isCreatingDummy, setIsCreatingDummy] = React.useState(false);

  const selectableIds = React.useMemo(() => props.rows.map((row) => row.id), [props.rows]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = computeAllSelected(selectedIds, selectableIds);

  function applyFilters(nextPage = 1) {
    const query = buildFilterQueryString({
      q,
      status,
      serviceType,
      projectType,
      page: nextPage,
      per: props.initialQS.per || 20,
    });
    router.push(`${pathname}?${query}`);
  }

  function resetFilters() {
    setQ("");
    setStatus("");
    setServiceType("");
    setProjectType("");
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("per", String(props.initialQS.per || 20));
    router.push(`${pathname}?${params.toString()}`);
  }

  const page = props.initialQS.page || 1;
  const per = props.initialQS.per || 20;
  const canPrev = page > 1;
  const canNext = props.total > page * per;
  const selectedCount = selectedIds.length;
  const activeFilters = countActiveFilters([q, status, serviceType, projectType]);

  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomName() {
    const first = ["Sofía", "Mateo", "Valentina", "Lucas", "Camila", "José", "Ana", "Sebastián", "Valeria", "Juan"];
    const last = ["Pérez", "González", "Rojas", "Silva", "Vega", "Díaz", "Soto", "Mora", "Castro", "Herrera"];
    const long = Math.random() < 0.2;
    const base = `${pick(first)} ${pick(last)}`;
    return long ? `${base} ${pick(last)} ${pick(last)}` : base;
  }

  function randomEmail(name: string) {
    const domains = ["lynxmedia.cl", "example.com", "correo.cl", "studio.com", "agency.io"];
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");
    return `${slug}${randInt(1, 99)}@${pick(domains)}`;
  }

  function buildSinglePayload() {
    const tracks = randInt(12, 32);
    const drumQuantize = Math.random() < 0.4;
    const vocalTracks = randInt(0, 5);
    const addons = {
      acapella: Math.random() < 0.3,
      instrumental: Math.random() < 0.3,
      liveBacking: Math.random() < 0.2,
      rush: Math.random() < 0.15,
      unlimitedRevs: Math.random() < 0.2,
    };
    const pricing =
      30000 +
      (tracks - 12) * 1200 +
      (drumQuantize ? 20000 : 0) +
      vocalTracks * 20000 +
      (addons.acapella ? 10000 : 0) +
      (addons.instrumental ? 15000 : 0) +
      (addons.liveBacking ? 20000 : 0) +
      (addons.rush ? 35000 : 0) +
      (addons.unlimitedRevs ? 40000 : 0);

    const name = randomName();
    return {
      projectType: "single",
      currency: "CLP",
      contact: {
        name,
        email: randomEmail(name),
        company: Math.random() < 0.4 ? "Agencia Lynx" : undefined,
        notes: Math.random() < 0.3 ? "Proyecto con referencia cine." : undefined,
        phone: Math.random() < 0.2 ? "+56 9 1234 5678" : undefined,
      },
      single: {
        tracks,
        overMax: false,
        drumQuantize,
        vocalTracks,
        addons,
        pricingClp: Math.round(pricing),
        breakdown: [
          { label: "Base", amount: 30000 },
          { label: "Tracks extra", amount: (tracks - 12) * 1200 },
        ],
      },
      pageUrl: typeof window !== "undefined" ? `${window.location.origin}/servicios/mix` : undefined,
    };
  }

  function buildAlbumPayload() {
    const name = randomName();
    const timelines = ["1-2 meses", "2-3 meses", "3-4 meses"];
    return {
      projectType: "album",
      currency: "CLP",
      contact: {
        name,
        email: randomEmail(name),
        company: Math.random() < 0.4 ? "Productora Sur" : undefined,
        notes: Math.random() < 0.3 ? "EP conceptual, referencias synth." : undefined,
        phone: Math.random() < 0.2 ? "+56 9 9876 5432" : undefined,
      },
      album: {
        songs: randInt(3, 12),
        timeline: pick(timelines),
        style: Math.random() < 0.6 ? "Synth / Cinematic" : "Indie / Alt",
        notes: Math.random() < 0.4 ? "Necesita cohesión entre tracks." : "",
      },
      pageUrl: typeof window !== "undefined" ? `${window.location.origin}/servicios/mix` : undefined,
    };
  }

  async function createDummy(kind: "single" | "album") {
    try {
      setIsCreatingDummy(true);
      const payload = kind === "single" ? buildSinglePayload() : buildAlbumPayload();
      const res = await fetch("/api/services/mix", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("No se pudo crear la solicitud dummy.");
    } finally {
      setIsCreatingDummy(false);
    }
  }

  const desktopColumns: AdminColumnDef<Row>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label="Seleccionar todas las solicitudes"
        />
      ),
      widthClassName: "w-12",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedSet.has(row.id)}
          onChange={() => setSelectedIds((current) => toggleSelection(current, row.id))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label={`Seleccionar solicitud ${row.id}`}
        />
      ),
    },
    {
      key: "cliente",
      label: "Cliente",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{row.name}</span>
          <CopyEmail email={row.email} />
        </div>
      ),
    },
    {
      key: "proyecto",
      label: "Proyecto",
      render: (row) => <span className="text-xs text-foreground">{projectSummary(row)}</span>,
    },
    {
      key: "metadata",
      label: "Metadata",
      render: (row) => <span className="text-xs text-muted-foreground">{metadataSummary(row)}</span>,
    },
    {
      key: "total",
      label: "Total",
      render: (row) => <span className="text-xs font-semibold">{formatPrice(row)}</span>,
    },
    {
      key: "estado",
      label: "Estado",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={row.status} />
          <UrgencyBadge value={row.urgency} />
        </div>
      ),
    },
    {
      key: "creado",
      label: "Creado",
      render: (row) => <span className="text-xs text-muted-foreground tabular-nums">{fmtDate(row.createdAt)}</span>,
    },
    {
      key: "deadline",
      label: "Deadline",
      render: (row) => <span className="text-xs text-muted-foreground tabular-nums">{fmtDate(row.deadlineAt)}</span>,
    },
    {
      key: "acciones",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <Link
          href={`/admin/requests/${row.id}`}
          className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
        >
          Ver detalle
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminListShell className="rounded-[2px] bg-card/80">
        <AdminListHeader
          title="Solicitudes"
          subtitle="Bandeja única"
          count={<AdminStatusBadge>Total {props.total}</AdminStatusBadge>}
          statusBadge={<AdminStatusBadge className="capitalize">{selectedCount > 0 ? `${selectedCount} seleccionados` : "sin selección"}</AdminStatusBadge>}
          actionSlot={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/requests/mix"
                className="rounded-[2px] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/45"
              >
                Ver solo Mix/Master
              </Link>
              <button
                type="button"
                disabled={isCreatingDummy}
                className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  void createDummy("single");
                }}
              >
                Dummy Single
              </button>
              <button
                type="button"
                disabled={isCreatingDummy}
                className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  void createDummy("album");
                }}
              >
                Dummy Álbum
              </button>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted/45"
                aria-label="Refrescar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          }
        />

        <div className="border-b border-border px-3 py-2 sm:px-4">
          <div className="grid gap-2 xl:grid-cols-2">
            <form method="GET" action="/admin/requests" className="min-w-0" onSubmit={(event) => event.preventDefault()}>
              <AdminFilterPanel
                title="Filtros de lista"
                statusSlot={
                  <>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <AdminStatusBadge>
                      {activeFilters === 0 ? "Sin filtros" : `${activeFilters} filtros activos`}
                    </AdminStatusBadge>
                  </>
                }
                actionSlot={
                  <>
                    <button
                      type="button"
                      onClick={() => applyFilters(1)}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
                    >
                      Limpiar
                    </button>
                  </>
                }
              >
                <AdminControlsRow innerClassName="w-full">
                  <div className="grid min-w-[260px] flex-1 gap-1">
                    <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                    <input
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="Buscar nombre/email/detalle"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>

                  <LabeledSelect
                    rootClassName="w-[128px]"
                    label="TIPO"
                    labelPosition="top"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="h-9 w-full"
                    options={[
                      { value: "", label: "TODOS" },
                      { value: "single", label: "SINGLE" },
                      { value: "album", label: "ÁLBUM / EP" },
                    ]}
                  />

                  <LabeledSelect
                    rootClassName="w-[150px]"
                    label="SERVICIO"
                    labelPosition="top"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="h-9 w-full"
                    options={[
                      { value: "", label: "TODOS" },
                      ...props.serviceOptions.map((value) => ({ value, label: value.toUpperCase() })),
                    ]}
                  />

                  <LabeledSelect
                    rootClassName="w-[148px]"
                    label="STATUS"
                    labelPosition="top"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 w-full"
                    options={[
                      { value: "", label: "TODOS" },
                      ...props.statusOptions.map((value) => ({ value, label: value.replaceAll("_", " ") })),
                    ]}
                  />
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
              statusSlot={<AdminStatusBadge className="capitalize">{selectedCount > 0 ? `${selectedCount} seleccionados` : "sin selección"}</AdminStatusBadge>}
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

                <div className="grid gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                  <button
                    type="button"
                    disabled={selectedCount === 0 || isDeleting}
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/60 bg-destructive/10 px-2.5 text-xs text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Eliminar seleccionados"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>

                <div className="grid gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">Campo</span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    disabled={selectedCount === 0}
                    className="inline-flex h-8 items-center rounded-md border border-border px-2 text-xs transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Limpiar selección"
                    aria-label="Limpiar selección"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>
              </AdminControlsRow>
            </AdminBulkPanel>
          </div>
        </div>

        {props.rows.length === 0 ? (
          <AdminListEmptyState message="Sin resultados para los filtros actuales." />
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="space-y-3 p-3 md:hidden">
              {props.rows.map((row) => (
                <article
                  key={row.id}
                  className={cn(
                    "space-y-3 rounded-lg border border-border/70 bg-card p-3 transition-colors",
                    selectedSet.has(row.id) && "bg-accent/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                      <CopyEmail email={row.email} />
                    </div>
                    <Checkbox
                      aria-label="Seleccionar solicitud"
                      checked={selectedSet.has(row.id)}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        setSelectedIds((current) => (isChecked ? toggleSelection(current, row.id) : current.filter((id) => id !== row.id)));
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.status} />
                    <UrgencyBadge value={row.urgency} />
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Proyecto: <span className="text-foreground">{projectSummary(row)}</span>
                    </p>
                    <p>
                      Metadata: <span className="text-foreground">{metadataSummary(row)}</span>
                    </p>
                    <p>
                      Total: <span className="text-foreground">{formatPrice(row)}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide">Creado</p>
                      <p className="tabular-nums">{fmtDate(row.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide">Deadline</p>
                      <p className="tabular-nums">{fmtDate(row.deadlineAt)}</p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/requests/${row.id}`}
                    className="inline-flex h-8 w-full items-center justify-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
                  >
                    Ver detalle
                  </Link>
                </article>
              ))}
            </div>

            <div className="table-scroll hidden md:block">
              <AdminDataTable
                rows={props.rows}
                columns={desktopColumns}
                rowKey={(row) => row.id}
                rowClassName={(row) =>
                  cn(
                    "border-t border-border/70 hover:bg-muted/60",
                    selectedSet.has(row.id) && "bg-accent/20 hover:bg-accent/25",
                  )
                }
                tableClassName="w-full table-auto min-w-[1320px]"
                headerClassName="bg-muted/60"
              />
            </div>
          </TooltipProvider>
        )}

        <footer className="flex items-center justify-between gap-3 border-t border-border px-3 py-3 text-sm text-muted-foreground sm:px-4">
          <span>
            Página {page} · {props.rows.length} de {props.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => applyFilters(page - 1)}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => applyFilters(page + 1)}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </AdminListShell>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar solicitudes</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vas a eliminar {selectedCount} solicitud(es). Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-[2px] text-xs"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="h-8 rounded-[2px] text-xs"
              onClick={async () => {
                if (selectedCount === 0) return;
                try {
                  setIsDeleting(true);
                  const res = await fetch("/api/admin/requests/bulk-delete", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ ids: selectedIds }),
                  });
                  if (!res.ok) throw new Error("Failed");
                  setSelectedIds([]);
                  setConfirmOpen(false);
                  router.refresh();
                } catch {
                  alert("No se pudieron eliminar las solicitudes.");
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
