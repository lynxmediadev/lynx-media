// src/app/admin/tracks/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Admin · /admin/tracks                                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Lista tracks con foco en su estado técnico de análisis.                  │
 * │ - Muestra: título, artista, estado (audio/análisis), métricas de audio     │
 * │   (LUFS, LRA, True Peak, duración, sample rate) y acciones.                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Tabla contenida en una card con overflow-hidden.                         │
 * │ - Paginación simple con ?page=&per=.                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Ban, Clock3, ShieldCheck } from "lucide-react";
import prisma from "@/lib/prisma";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import {
  AdminDataTable,
  AdminListEmptyState,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListHeader,
  AdminListShell,
  AdminStatusBadge,
  countActiveFilters,
  type AdminColumnDef,
} from "@/components/admin/list-kit";

export const dynamic = "force-dynamic";

type AnalyzeRow = {
  id: string;
  title: string | null;
  artist: string | null;
  createdAt: Date;
  updatedAt: Date;
  analysisAt: Date | null;
  assetKey: string | null;
  audioUrl: string | null;
  moodLinks: Array<{
    mood: {
      name: string;
    };
  }>;
  durationSec: number | null;
  sampleRateHz: number | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
  bpm: number | null;
  key: string | null;
  trackType: string | null;
  genres: string[];
  subgenres: string[];
  licenseType: string | null;
  mediaBuy: string | null;
  oneStop: boolean | null;
  clearedForSync: boolean | null;
  exclusiveTerritories: string[];
  exclusiveTermMonths: number | null;
  restrictedTerritories: string[];
  restrictedIndustries: string[];
  restrictedPlatforms: string[];
  restrictedBrands: string[];
  restrictions: string[];
  pricingTier: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  versions: Array<{
    label: string;
    durationSec: number | null;
    kind: string | null;
    sortOrder: number | null;
  }>;
  stems: Array<{
    name: string;
    group: string | null;
    sortOrder: number | null;
  }>;
};

type SearchDict = Record<string, string | string[] | undefined>;

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page(props: {
  searchParams: Promise<SearchDict>;
}) {
  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const analysis = (first(sp.analysis) ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(100, Math.max(10, parseInt(first(sp.per) ?? "50", 10) || 50));
  const skip = (page - 1) * per;
  const activeFilterCount = countActiveFilters([q, analysis]);

  const whereAND: Prisma.TrackWhereInput[] = [];

  if (q) {
    whereAND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { artist: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (analysis === "analyzed") {
    whereAND.push({ analysisAt: { not: null } });
  } else if (analysis === "pending") {
    whereAND.push({ analysisAt: null });
    whereAND.push({
      OR: [{ assetKey: { not: "" } }, { audioUrl: { not: "" } }],
    });
  } else if (analysis === "no_audio") {
    whereAND.push({ assetKey: "" });
    whereAND.push({ audioUrl: "" });
  }

  const where: Prisma.TrackWhereInput = whereAND.length > 0 ? { AND: whereAND } : {};

  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: per,
      skip,
      select: {
        id: true,
        title: true,
        artist: true,
        createdAt: true,
        updatedAt: true,
        analysisAt: true,
        assetKey: true,
        audioUrl: true,
        moodLinks: {
          select: {
            mood: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            mood: {
              name: "asc",
            },
          },
        },
        durationSec: true,
        sampleRateHz: true,
        loudnessLufs: true,
        loudnessRangeLu: true,
        truePeakDbfs: true,
        bpm: true,
        key: true,
        trackType: true,
        genres: true,
        subgenres: true,
        licenseType: true,
        mediaBuy: true,
        oneStop: true,
        clearedForSync: true,
        exclusiveTerritories: true,
        exclusiveTermMonths: true,
        restrictedTerritories: true,
        restrictedIndustries: true,
        restrictedPlatforms: true,
        restrictedBrands: true,
        restrictions: true,
        pricingTier: true,
        budgetMin: true,
        budgetMax: true,
        budgetCurrency: true,
        versions: {
          select: {
            label: true,
            durationSec: true,
            kind: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        stems: {
          select: {
            name: true,
            group: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.track.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / per));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (analysis) qs.set("analysis", analysis);
    qs.set("page", String(target));
    qs.set("per", String(per));
    return `/admin/tracks?${qs.toString()}`;
  };

  const clearHref = `/admin/tracks?page=1&per=${per}`;

  const desktopColumns: AdminColumnDef<AnalyzeRow>[] = [
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
      render: (track) => <EstadoChip row={track} />,
    },
    {
      key: "audio",
      label: "Audio",
      render: (track) => <AudioInfo row={track} />,
    },
    {
      key: "analizado",
      label: "Analizado",
      render: (track) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          {track.analysisAt ? (
            <>
              <span className="text-success">Analizado</span>
              <span>{formatDateTime(track.analysisAt)}</span>
            </>
          ) : (
            <span className="text-warning">Sin análisis</span>
          )}
        </div>
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      align: "right",
      render: (track) => <AnalyzeActions id={track.id} audioUrl={track.audioUrl} className="justify-end" />,
    },
  ];

  return (
    <section>
      <AdminListShell className="relative bg-muted/30 backdrop-blur">
        <AdminListHeader
          title="Análisis técnico de tracks"
          subtitle="Estado técnico, métricas de audio y acceso rápido a ficha"
          count={
            <AdminStatusBadge>
              Página {page} de {totalPages} · {total} track{total === 1 ? "" : "s"}
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
        <div className="border-b border-border px-3 py-2 sm:px-4">
          <form method="GET" action="/admin/tracks">
            <input type="hidden" name="page" value="1" />
            <AdminFilterPanel
              title="Filtros de lista"
              statusSlot={
                <>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <AdminStatusBadge>
                    {activeFilterCount === 0
                      ? "Sin filtros"
                      : `${activeFilterCount} ${
                          activeFilterCount === 1 ? "filtro activo" : "filtros activos"
                        }`}
                  </AdminStatusBadge>
                </>
              }
              actionSlot={
                <>
                  <button
                    type="submit"
                    className="rounded-md border border-border bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90"
                  >
                    Aplicar
                  </button>
                  <Link
                    href={clearHref}
                    className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/45"
                  >
                    Limpiar
                  </Link>
                </>
              }
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar título o artista"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
                />
                <div className="grid gap-1">
                  <span className="text-center text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
                    Estado
                  </span>
                  <select
                    name="analysis"
                    defaultValue={analysis}
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">Todos</option>
                    <option value="analyzed">Analizado</option>
                    <option value="pending">Sin análisis</option>
                    <option value="no_audio">Sin audio</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <span className="text-center text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
                    Por página
                  </span>
                  <select
                    name="per"
                    defaultValue={String(per)}
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </AdminFilterPanel>
          </form>
        </div>
        <div className="border-b border-border px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {tracks.length} track{tracks.length === 1 ? "" : "s"} en esta página
        </div>

        {tracks.length === 0 ? (
          <AdminListEmptyState message="No hay tracks registrados todavía." />
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {tracks.map((track) => (
                <article
                  key={track.id}
                  className="space-y-3 rounded-lg border border-border/70 bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
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

                    <div className="shrink-0">
                      <EstadoChip row={track} />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/60 pt-2">
                    <MetadataSummary row={track} />
                    <AudioInfo row={track} />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
                    {track.analysisAt ? (
                      <>
                        <span className="text-success">Analizado</span>
                        <span>{formatDateTime(track.analysisAt)}</span>
                      </>
                    ) : (
                      <span className="text-warning">Sin análisis</span>
                    )}
                  </div>

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
                rows={tracks}
                columns={desktopColumns}
                rowKey={(track) => track.id}
                rowClassName="border-t border-border/70 hover:bg-muted/60"
                tableClassName="w-full table-auto min-w-[1100px]"
                headerClassName="bg-muted/60"
              />
            </div>
          </>
        )}
      </AdminListShell>
    </section>
  );
}

function EstadoChip({ row }: { row: AnalyzeRow }) {
  const hasAudio = !!(row.assetKey || row.audioUrl);
  const analyzed = !!row.analysisAt;

  if (!hasAudio) {
    return (
      <AdminIconBadge
        tone="danger"
        icon={<Ban className="h-3.5 w-3.5" aria-hidden="true" />}
        label="SIN AUDIO"
      />
    );
  }

  if (!analyzed) {
    return (
      <AdminIconBadge
        tone="warning"
        icon={<Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
        label="SIN ANÁLISIS"
      />
    );
  }

  return (
    <AdminIconBadge
      tone="success"
      icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
      label="ANALIZADO"
    />
  );
}

function AudioInfo({ row }: { row: AnalyzeRow }) {
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

  const lufs =
    typeof row.loudnessLufs === "number" ? row.loudnessLufs.toFixed(2) : null;
  const lra =
    typeof row.loudnessRangeLu === "number"
      ? row.loudnessRangeLu.toFixed(2)
      : null;
  const tp =
    typeof row.truePeakDbfs === "number" ? row.truePeakDbfs.toFixed(2) : null;

  const dur =
    typeof row.durationSec === "number"
      ? `${Math.round(row.durationSec)} s`
      : null;
  const sr =
    typeof row.sampleRateHz === "number" ? `${row.sampleRateHz} Hz` : null;

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

function MetadataSummary({ row }: { row: AnalyzeRow }) {
  const moods = formatListShort(row.moodLinks.map((entry) => entry.mood.name));
  const genres = formatListShort(row.genres);
  const licenseTypeLabel = formatLicenseType(row.licenseType);
  const mediaBuyLine = formatText(row.mediaBuy);

  return (
    <div className="flex flex-col space-y-1 text-[11px] text-muted-foreground">
      <span className="line-clamp-2">
        Moods: {moods ?? "—"}
      </span>
      <span className="line-clamp-2">
        Género: {genres ?? "—"}
      </span>
      <span className="line-clamp-2">
        Tipo de licencia: {licenseTypeLabel ?? "—"}
      </span>
      <span className="line-clamp-2">
        Media buy: {mediaBuyLine ?? "—"}
      </span>
    </div>
  );
}

function formatDateTime(d: Date) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function formatText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatListShort(
  values: string[] | null | undefined,
  maxItems = 3,
): string | null {
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
