"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ban, Check, Clock3, Copy, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import {
  allSelected as computeAllSelected,
  AdminBulkPanel,
  AdminControlsRow,
  AdminDataTable,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListEmptyState,
  AdminStatusBadge,
  selectAllOrNone,
  toggleSelection,
  type AdminColumnDef,
} from "@/components/admin/list-kit";

export type TrackListRow = {
  id: string;
  title: string | null;
  artist: string | null;
  analysisAtIso: string | null;
  assetKey: string | null;
  audioUrl: string | null;
  moodNames: string[];
  genres: string[];
  licenseType: string | null;
  mediaBuy: string | null;
  durationSec: number | null;
  sampleRateHz: number | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
};

type TracksTableClientProps = {
  tracks: TrackListRow[];
  filters: {
    q: string;
    analysis: string;
    per: number;
    activeCount: number;
  };
};

function trackStatus(row: TrackListRow): "NO_AUDIO" | "PENDING" | "ANALYZED" {
  const hasAudio = !!(row.assetKey || row.audioUrl);
  if (!hasAudio) return "NO_AUDIO";
  if (!row.analysisAtIso) return "PENDING";
  return "ANALYZED";
}

function statusBadge(row: TrackListRow) {
  const status = trackStatus(row);
  if (status === "NO_AUDIO") {
    return <AdminIconBadge tone="danger" icon={<Ban aria-hidden="true" />} label="SIN AUDIO" />;
  }
  if (status === "PENDING") {
    return <AdminIconBadge tone="warning" icon={<Clock3 aria-hidden="true" />} label="SIN ANÁLISIS" />;
  }
  return <AdminIconBadge tone="success" icon={<ShieldCheck aria-hidden="true" />} label="ANALIZADO" />;
}

function analysisBadge(row: TrackListRow) {
  if (row.analysisAtIso) {
    return (
      <div className="flex flex-col items-start gap-1">
        <AdminIconBadge tone="success" icon={<ShieldCheck aria-hidden="true" />} label="ANALIZADO" />
        <span className="text-[11px] text-muted-foreground">{formatDateTime(row.analysisAtIso)}</span>
      </div>
    );
  }
  return <AdminIconBadge tone="warning" icon={<Clock3 aria-hidden="true" />} label="PENDIENTE" />;
}

export function TracksTableClient({ tracks, filters }: TracksTableClientProps) {
  const [rows, setRows] = useState<TrackListRow[]>(tracks);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [analyzeState, setAnalyzeState] = useState<{
    type: "idle" | "running" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyzeResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectableIds = useMemo(() => rows.map((track) => track.id), [rows]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = computeAllSelected(selectedIds, selectableIds);
  const selectionStateLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} ${selectedIds.length === 1 ? "seleccionado" : "seleccionados"}`
      : "sin selección";

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
      if (analyzeResetRef.current) {
        clearTimeout(analyzeResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setRows(tracks);
  }, [tracks]);

  async function handleCopySelected() {
    if (selectedIds.length === 0) return;
    try {
      await navigator.clipboard.writeText(selectedIds.join(","));
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    if (copyResetRef.current) {
      clearTimeout(copyResetRef.current);
    }
    copyResetRef.current = setTimeout(() => setCopyState("idle"), 1500);
  }

  async function handleAnalyzeSelected() {
    if (selectedIds.length === 0) return;
    setAnalyzeState({ type: "running", message: `Analizando ${selectedIds.length} track(s)...` });

    let okCount = 0;
    let failCount = 0;
    const rowMap = new Map(rows.map((row) => [row.id, row] as const));

    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/tracks/${encodeURIComponent(id)}/analyze`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          failCount += 1;
          continue;
        }

        okCount += 1;
        const updated = payload.updated as Partial<{
          durationSec: number | null;
          sampleRateHz: number | null;
          loudnessLufs: number | null;
          loudnessRangeLu: number | null;
          truePeakDbfs: number | null;
          analysisAt: string | Date | null;
        }> | null;

        if (!updated) continue;

        const current = rowMap.get(id);
        if (!current) continue;
        rowMap.set(id, {
          ...current,
          durationSec: updated.durationSec ?? current.durationSec,
          sampleRateHz: updated.sampleRateHz ?? current.sampleRateHz,
          loudnessLufs: updated.loudnessLufs ?? current.loudnessLufs,
          loudnessRangeLu: updated.loudnessRangeLu ?? current.loudnessRangeLu,
          truePeakDbfs: updated.truePeakDbfs ?? current.truePeakDbfs,
          analysisAtIso:
            typeof updated.analysisAt === "string"
              ? updated.analysisAt
              : updated.analysisAt instanceof Date
                ? updated.analysisAt.toISOString()
                : current.analysisAtIso,
        });
      } catch {
        failCount += 1;
      }
    }

    setRows(rows.map((row) => rowMap.get(row.id) ?? row));

    if (analyzeResetRef.current) {
      clearTimeout(analyzeResetRef.current);
    }
    if (failCount === 0) {
      setAnalyzeState({ type: "success", message: `Analizados: ${okCount}/${selectedIds.length}` });
      analyzeResetRef.current = setTimeout(() => setAnalyzeState({ type: "idle", message: "" }), 2000);
      return;
    }
    setAnalyzeState({
      type: "error",
      message: `Analizados: ${okCount}/${selectedIds.length} · errores: ${failCount}`,
    });
    analyzeResetRef.current = setTimeout(() => setAnalyzeState({ type: "idle", message: "" }), 3500);
  }

  const desktopColumns: AdminColumnDef<TrackListRow>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label="Seleccionar todos los tracks"
        />
      ),
      widthClassName: "w-12",
      render: (track) => (
        <input
          type="checkbox"
          checked={selectedSet.has(track.id)}
          onChange={() => setSelectedIds((current) => toggleSelection(current, track.id))}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label={`Seleccionar track ${track.title ?? track.id}`}
        />
      ),
    },
    {
      key: "track",
      label: "Track",
      render: (track) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{track.title || "(sin título)"}</span>
          <span className="text-xs text-muted-foreground">{track.artist || "(sin artista)"}</span>
          <span className="mt-1 font-mono text-[10px] break-words text-muted-foreground">ID: {track.id}</span>
        </div>
      ),
    },
    {
      key: "metadata",
      label: "Metadata",
      render: (track) => <MetadataSummary row={track} />,
    },
    {
      key: "estado",
      label: "Estado",
      render: (track) => statusBadge(track),
    },
    {
      key: "audio",
      label: "Audio",
      render: (track) => <AudioInfo row={track} />,
    },
    {
      key: "analizado",
      label: "Analizado",
      render: (track) => analysisBadge(track),
    },
    {
      key: "acciones",
      label: "Acciones",
      align: "right",
      render: (track) => <AnalyzeActions id={track.id} audioUrl={track.audioUrl} className="justify-end" />,
    },
  ];

  if (rows.length === 0) {
    return <AdminListEmptyState message="No hay tracks registrados todavía." />;
  }

  return (
    <>
      <div className="border-b border-border px-3 py-2 sm:px-4">
        <div className="grid gap-2 xl:grid-cols-2">
          <form method="GET" action="/admin/tracks" className="min-w-0">
            <input type="hidden" name="page" value="1" />
            <AdminFilterPanel
              title="Filtros de lista"
              statusSlot={
                <>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <AdminStatusBadge className="capitalize">
                    {filters.activeCount === 0
                      ? "sin filtros"
                      : `${filters.activeCount} ${filters.activeCount === 1 ? "filtro activo" : "filtros activos"}`}
                  </AdminStatusBadge>
                </>
              }
              actionSlot={
                <>
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
                  >
                    Aplicar
                  </button>
                  <a
                    href={`/admin/tracks?page=1&per=${filters.per}`}
                    className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
                  >
                    Limpiar
                  </a>
                </>
              }
            >
              <AdminControlsRow innerClassName="w-full">
                  <div className="grid min-w-[260px] flex-1 gap-1">
                    <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                      Campo
                    </span>
                    <input
                      type="text"
                      name="q"
                      defaultValue={filters.q}
                      placeholder="Buscar título o artista"
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </div>

                  <div className="grid w-[150px] gap-1">
                    <span className="text-center text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
                      ESTADO
                    </span>
                    <select
                      name="analysis"
                      defaultValue={filters.analysis}
                      className="h-9 w-full rounded-md border border-border bg-background px-3 pr-8 text-sm"
                    >
                      <option value="">TODOS</option>
                      <option value="analyzed">ANALIZADO</option>
                      <option value="pending">SIN ANÁLISIS</option>
                      <option value="no_audio">SIN AUDIO</option>
                    </select>
                  </div>

                  <div className="grid w-[120px] gap-1">
                    <span className="text-center text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
                      POR PÁGINA
                    </span>
                    <select
                      name="per"
                      defaultValue={String(filters.per)}
                      className="h-9 w-full rounded-md border border-border bg-background px-3 pr-8 text-sm"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
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
                {analyzeState.type !== "idle" ? (
                  <AdminStatusBadge
                    tone={
                      analyzeState.type === "success"
                        ? "success"
                        : analyzeState.type === "error"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {analyzeState.message}
                  </AdminStatusBadge>
                ) : null}
              </div>
            }
            className="bg-background/30"
          >
            <AdminControlsRow>
                <div className="grid gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                    Campo
                  </span>
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
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                    Campo
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void handleAnalyzeSelected();
                    }}
                    disabled={selectedIds.length === 0 || analyzeState.type === "running"}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analyzeState.type === "running" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    Analizar
                  </button>
                </div>

                <div className="grid gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                    Campo
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopySelected();
                    }}
                    disabled={selectedIds.length === 0}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      copyState === "copied" ? "border-emerald-500/50 text-emerald-300" : "",
                      copyState === "error" ? "border-destructive/60 text-destructive" : "",
                    )}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copyState === "copied" ? "Copiado" : copyState === "error" ? "Error" : "Copiar IDs"}
                  </button>
                </div>

                <div className="grid gap-1">
                  <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                    Campo
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    disabled={selectedIds.length === 0}
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

      <div className="space-y-3 p-3 md:hidden">
        {rows.map((track) => (
          <article
            key={track.id}
            className={cn(
              "space-y-3 rounded-lg border border-border/70 bg-card p-3 transition-colors",
              selectedSet.has(track.id) ? "bg-accent/20" : "",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedSet.has(track.id)}
                  onChange={() => setSelectedIds((current) => toggleSelection(current, track.id))}
                  className="mt-0.5 h-4 w-4 rounded border-border bg-background"
                  aria-label={`Seleccionar track ${track.title ?? track.id}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {track.title || "(sin título)"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {track.artist || "(sin artista)"}
                  </p>
                  <p className="mt-1 font-mono text-[10px] break-all text-muted-foreground">
                    ID: {track.id}
                  </p>
                </div>
              </div>

              <div className="shrink-0">{statusBadge(track)}</div>
            </div>

            <div className="space-y-2 border-t border-border/60 pt-2">
              <MetadataSummary row={track} />
              <AudioInfo row={track} />
            </div>

            <div className="border-t border-border/60 pt-2">{analysisBadge(track)}</div>

            <div className="border-t border-border/60 pt-2">
              <AnalyzeActions
                id={track.id}
                audioUrl={track.audioUrl}
                className="w-full justify-between"
              />
            </div>
          </article>
        ))}
      </div>

      <div className="table-scroll hidden md:block">
        <AdminDataTable
          rows={rows}
          columns={desktopColumns}
          rowKey={(track) => track.id}
          rowClassName={(track) =>
            cn(
              "border-t border-border/70 hover:bg-muted/60",
              selectedSet.has(track.id) && "bg-accent/20 hover:bg-accent/25",
            )
          }
          tableClassName="w-full table-auto min-w-[1140px]"
          headerClassName="bg-muted/60"
        />
      </div>
    </>
  );
}

function AudioInfo({ row }: { row: TrackListRow }) {
  const hasAnalysis =
    typeof row.loudnessLufs === "number" ||
    typeof row.loudnessRangeLu === "number" ||
    typeof row.truePeakDbfs === "number" ||
    typeof row.durationSec === "number" ||
    typeof row.sampleRateHz === "number";

  if (!hasAnalysis) {
    return (
      <span className="text-xs text-muted-foreground">
        Sin análisis. Usa <span className="font-semibold">Analizar</span>.
      </span>
    );
  }

  const lufs = typeof row.loudnessLufs === "number" ? row.loudnessLufs.toFixed(2) : null;
  const lra = typeof row.loudnessRangeLu === "number" ? row.loudnessRangeLu.toFixed(2) : null;
  const tp = typeof row.truePeakDbfs === "number" ? row.truePeakDbfs.toFixed(2) : null;

  const dur = typeof row.durationSec === "number" ? `${Math.round(row.durationSec)} s` : null;
  const sr = typeof row.sampleRateHz === "number" ? `${row.sampleRateHz} Hz` : null;

  return (
    <div className="flex flex-col space-y-1 text-[11px] text-foreground">
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <span className="font-mono">LUFS: {lufs ?? "–"}</span>
        <span className="font-mono">LRA: {lra ?? "–"}</span>
        <span className="font-mono">TP: {tp ?? "–"}</span>
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground">
        <span>{dur ? `Dur: ${dur}` : "Dur: –"}</span>
        <span>{sr ? `SR: ${sr}` : "SR: –"}</span>
      </div>
    </div>
  );
}

function MetadataSummary({ row }: { row: TrackListRow }) {
  const moods = formatListShort(row.moodNames);
  const genres = formatListShort(row.genres);
  const licenseTypeLabel = formatLicenseType(row.licenseType);
  const mediaBuyLine = formatText(row.mediaBuy);

  return (
    <div className="flex flex-col space-y-1 text-[11px] text-muted-foreground">
      <span className="line-clamp-2">Moods: {moods ?? "—"}</span>
      <span className="line-clamp-2">Género: {genres ?? "—"}</span>
      <span className="line-clamp-2">Tipo de licencia: {licenseTypeLabel ?? "—"}</span>
      <span className="line-clamp-2">Media buy: {mediaBuyLine ?? "—"}</span>
    </div>
  );
}

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatListShort(values: string[] | null | undefined, maxItems = 3): string | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length <= maxItems) return cleaned.join(", ");
  const remaining = cleaned.length - maxItems;
  return `${cleaned.slice(0, maxItems).join(", ")} +${remaining}`;
}

function formatLicenseType(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "NON_EXCLUSIVE":
      return "No exclusiva";
    case "EXCLUSIVE":
      return "Exclusiva";
    case "LIMITED_EXCLUSIVE":
      return "Exclusiva limitada";
    case "BUYOUT":
      return "Buyout";
    default:
      return value;
  }
}
