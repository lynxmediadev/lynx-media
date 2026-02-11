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
import prisma from "@/lib/prisma";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import { getAudioCheckStatus } from "@/lib/audio/audio-check";

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
  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(100, Math.max(10, parseInt(first(sp.per) ?? "50", 10) || 50));
  const skip = (page - 1) * per;

  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
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
    prisma.track.count(),
  ]);

  const audioChecks = await Promise.all(
    tracks.map(async (track) => ({
      id: track.id,
      result: await getAudioCheckStatus(track.audioUrl, {
        cacheKey: track.id,
      }),
    })),
  );
  const audioCheckById = new Map(
    audioChecks.map(({ id, result }) => [id, result]),
  );

  const totalPages = Math.max(1, Math.ceil(total / per));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    qs.set("page", String(target));
    qs.set("per", String(per));
    return `/admin/tracks?${qs.toString()}`;
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Análisis técnico de tracks
        </h1>
        <p className="text-sm text-muted-foreground">
          Panel de control para revisar el estado de análisis de cada track,
          métricas de audio y acceso rápido a la ficha técnica.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {total} track
            {total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={buildHref(prevPage)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
              aria-disabled={page <= 1}
            >
              ← Anterior
            </Link>
            <Link
              href={buildHref(nextPage)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
              aria-disabled={page >= totalPages}
            >
              Siguiente →
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur">
        <div className="border-b border-border px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {tracks.length} track{tracks.length === 1 ? "" : "s"} en esta página
        </div>

        <div className="table-scroll">
        <table className="w-full table-auto text-sm min-w-[1100px]">
          <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 text-left align-middle">Track</th>
              <th className="px-4 py-3 text-left align-middle">Metadata</th>
              <th className="px-4 py-3 text-left align-middle">Estado</th>
              <th className="px-4 py-3 text-left align-middle">Audio</th>
              <th className="px-4 py-3 text-left align-middle">Analizado</th>
              <th className="px-4 py-3 text-right align-middle">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-xs text-muted-foreground"
                >
                  No hay tracks registrados todavía.
                </td>
              </tr>
            ) : (
              tracks.map((t) => {
                const audioCheck = audioCheckById.get(t.id);
                return (
                  <tr
                    key={t.id}
                    className="border-t border-border/70 hover:bg-muted/60"
                  >
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {t.title || "(sin título)"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.artist || "(sin artista)"}
                      </span>
                      <span className="mt-1 font-mono text-[10px] break-words text-muted-foreground">
                        ID: {t.id}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <MetadataSummary row={t} />
                  </td>

                  <td className="px-4 py-3 align-top">
                    <EstadoChip row={t} />
                  </td>

                  <td className="px-4 py-3 align-top">
                    <AudioInfo row={t} />
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col text-xs text-muted-foreground">
                      {t.analysisAt ? (
                        <>
                          <span className="text-success">Analizado</span>
                          <span>{formatDateTime(t.analysisAt)}</span>
                        </>
                      ) : (
                        <span className="text-warning">Sin análisis</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <AnalyzeActions
                      id={t.id}
                      audioUrl={t.audioUrl}
                      initialAudioStatus={audioCheck?.status}
                      initialAudioMessage={audioCheck?.message ?? null}
                      className="justify-end"
                    />
                  </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </section>
    </section>
  );
}

function EstadoChip({ row }: { row: AnalyzeRow }) {
  const hasAudio = !!(row.assetKey || row.audioUrl);
  const analyzed = !!row.analysisAt;

  const baseClass =
    "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-medium";

  if (!hasAudio) {
    return (
      <span
        className={
          baseClass + " border border-border bg-muted/60 text-muted-foreground"
        }
      >
        Sin audio
      </span>
    );
  }

  if (!analyzed) {
    return (
      <span
        className={
          baseClass +
          " border border-warning/50 bg-warning/10 text-warning"
        }
      >
        Sin análisis
      </span>
    );
  }

  return (
    <span
      className={
        baseClass +
        " border border-success/50 bg-success/10 text-success"
      }
    >
      Analizado
    </span>
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

function formatTrackType(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "INSTRUMENTAL":
      return "Instrumental";
    case "VOCAL":
      return "Vocal";
    case "VOCAL_INSTRUMENTAL":
      return "Vocal + instrumental";
    case "OTHER":
      return "Otro";
    default:
      return value;
  }
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

function formatPricingTier(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "LOW":
      return "Low";
    case "MID":
      return "Mid";
    case "HIGH":
      return "High";
    case "BESPOKE":
      return "Bespoke";
    default:
      return value;
  }
}

function formatBudgetRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
) {
  const hasMin = typeof min === "number" && Number.isFinite(min);
  const hasMax = typeof max === "number" && Number.isFinite(max);
  if (!hasMin && !hasMax) return null;
  const prefix = currency ? `${currency} ` : "";
  if (hasMin && hasMax) return `${prefix}${min} - ${max}`;
  if (hasMin) return `${prefix}${min}+`;
  return `${prefix}${max}`;
}

function formatVersionLabel(version: AnalyzeRow["versions"][number]) {
  const label = formatText(version.label);
  if (label) return label;
  if (version.kind) return version.kind;
  if (typeof version.durationSec === "number") return `${version.durationSec}s`;
  return null;
}

function formatStemLabel(stem: AnalyzeRow["stems"][number]) {
  const name = formatText(stem.name);
  if (!name) return null;
  const group = formatStemGroup(stem.group);
  return group ? `${name} (${group})` : name;
}

function formatStemGroup(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "INSTRUMENT":
      return "Instr";
    case "VOCAL":
      return "Vocal";
    case "FX":
      return "FX";
    case "PERCUSSION":
      return "Perc";
    case "OTHER":
      return "Otro";
    default:
      return value;
  }
}

function formatClearance(oneStop: boolean | null, cleared: boolean | null) {
  const parts: string[] = [];
  if (oneStop) parts.push("One-stop");
  if (cleared) parts.push("Cleared");
  return parts.length ? parts.join(" · ") : null;
}

function formatRestrictionsSummary(row: AnalyzeRow) {
  const parts: string[] = [];
  const terr = formatListShort(row.restrictedTerritories, 2);
  const ind = formatListShort(row.restrictedIndustries, 2);
  const plat = formatListShort(row.restrictedPlatforms, 2);
  const brands = formatListShort(row.restrictedBrands, 2);
  const text = formatListShort(row.restrictions, 2);

  if (terr) parts.push(`Terr: ${terr}`);
  if (ind) parts.push(`Ind: ${ind}`);
  if (plat) parts.push(`Plat: ${plat}`);
  if (brands) parts.push(`Marcas: ${brands}`);
  if (text) parts.push(`Texto: ${text}`);

  return parts.length ? parts.join(" · ") : null;
}

function formatPricingSummary(row: AnalyzeRow) {
  const tier = formatPricingTier(row.pricingTier);
  const budget = formatBudgetRange(
    row.budgetMin,
    row.budgetMax,
    row.budgetCurrency,
  );
  if (tier && budget) return `${tier} · ${budget}`;
  return tier ?? budget;
}

function formatDeliverablesSummary(row: AnalyzeRow) {
  const versionLabels = row.versions
    .map((version) => formatVersionLabel(version))
    .filter((value): value is string => Boolean(value));
  const stemLabels = row.stems
    .map((stem) => formatStemLabel(stem))
    .filter((value): value is string => Boolean(value));

  const versions = formatListShort(versionLabels, 3);
  const stems = formatListShort(stemLabels, 3);

  if (versions && stems) return `${versions} / ${stems}`;
  return versions ?? stems;
}
