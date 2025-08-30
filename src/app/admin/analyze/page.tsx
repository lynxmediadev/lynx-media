/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/app/admin/analyze/page.tsx                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Vista Overview: lista tracks con búsqueda, filtro de Estado, orden y      │
 * │   paginación. Incluye acciones rápidas.                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Server Component (sin hooks).                                             │
 * │ - Recibe q/status/sort/page por querystring.                                │
 * │ - ⚠️ Prisma 6 y nulls: ciertos filtros tipo `{ not: null }` o               │
 * │   `{ equals: null }` pueden disparar errores de validación en `count`.      │
 * │   Para no bloquearnos, cuando Estado ≠ "Todos", filtramos y paginamos EN    │
 * │   MEMORIA (post-query). Cuando Estado = "Todos", usamos `count` y `findMany`│
 * │   paginado en DB (eficiente).                                               │
 * │ - Con catálogos muy grandes podemos optimizar con cursores o un endpoint    │
 * │   dedicado (lo vemos si hace falta).                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import React from "react";
import Link from "next/link";
import { db } from "@/server/db";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import AnalyzeByIdForm from "@/components/admin/AnalyzeByIdForm";
import { formatBytes } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

// ———————————————————————————————————————————————————————————————
// Helpers para leer searchParams (Next 15 puede entregarlo como Promise)
// ———————————————————————————————————————————————————————————————
async function getParams(
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>,
) {
  const sp =
    "then" in (searchParams as any)
      ? await (searchParams as Promise<
          Record<string, string | string[] | undefined>
        >)
      : (searchParams as Record<string, string | string[] | undefined>);

  const q = (sp.q as string | undefined)?.trim() ?? "";
  const status = (sp.status as string | undefined) ?? "all"; // all|ok|missing|needs
  const sort = (sp.sort as string | undefined) ?? "updated_desc";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const pageSize = 50;
  return { q, status, sort, page, pageSize };
}

type Row = {
  id: string;
  title: string | null;
  artist: string | null;
  analysisAt: Date | null;
  updatedAt: Date;
  assetKey: string | null;
  assetMime: string | null;
  assetSize: number | null;
  audioUrl: string | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
  waveform: Buffer | null; // Prisma Bytes -> Buffer
};

type Status = { kind: "ok" } | { kind: "missing" } | { kind: "needs" };

// Estado derivado post-query (peras y manzanas: miramos asset + métricas + waveform)
function deriveStatus(t: Row): Status {
  const normalizedOk =
    !!t.assetKey && !!t.assetMime && t.assetSize != null && t.assetSize > 0;
  if (!normalizedOk) return { kind: "needs" }; // falta normalización

  const hasWaveform =
    !!t.waveform && (t.waveform as unknown as Buffer).length > 0;
  const hasAudioMetrics =
    t.loudnessLufs != null &&
    t.loudnessRangeLu != null &&
    t.truePeakDbfs != null;

  if (!hasWaveform || !hasAudioMetrics) return { kind: "missing" };
  return { kind: "ok" };
}

// Orden soportado -> Prisma orderBy
function orderByFromSort(sort: string) {
  switch (sort) {
    case "created_desc":
      return { createdAt: "desc" as const };
    case "created_asc":
      return { createdAt: "asc" as const };
    case "lufs_asc":
      return { loudnessLufs: "asc" as const };
    case "lufs_desc":
      return { loudnessLufs: "desc" as const };
    case "updated_asc":
      return { updatedAt: "asc" as const };
    case "updated_desc":
    default:
      return { updatedAt: "desc" as const };
  }
}

/**
 * Construye `where` SOLO para búsqueda (sin filtrar por Estado).
 * Razón: evitar combinaciones con null/NOT/equals en Prisma `count` (6.x)
 * que nos estaban tirando errores. El filtrado por Estado se hará en memoria
 * cuando status ≠ "all".
 */
function whereFromSearch(q: string) {
  if (!q) return {};
  return {
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { artist: { contains: q, mode: "insensitive" } },
      { id: { equals: q } }, // ID exacto
    ],
  };
}

/** Mapea `status` string -> predicado de filtrado en memoria */
function predicateFromStatus(status: string) {
  return (r: Row & { __status: Status }) => {
    if (status === "ok") return r.__status.kind === "ok";
    if (status === "missing") return r.__status.kind === "missing";
    if (status === "needs") return r.__status.kind === "needs";
    return true; // all
  };
}

export default async function AnalyzeOverviewPage({ searchParams }: PageProps) {
  const { q, status, sort, page, pageSize } = await getParams(searchParams);

  const where = whereFromSearch(q);
  const orderBy = orderByFromSort(sort);

  // Selección mínima necesaria para derivar estado y renderizar filas
  const baseSelect = {
    id: true,
    title: true,
    artist: true,
    analysisAt: true,
    updatedAt: true,
    assetKey: true,
    assetMime: true,
    assetSize: true,
    audioUrl: true,
    loudnessLufs: true,
    loudnessRangeLu: true,
    truePeakDbfs: true,
    waveform: true,
  } satisfies Record<keyof Row, true>;

  // ──────────────────────────────────────────────────────────────
  // Plan A (eficiente): Estado = "Todos" → count + findMany paginado en DB
  // Plan B (robusto):   Estado ≠ "Todos" → findMany completo y filtrar/paginar en memoria
  // ──────────────────────────────────────────────────────────────
  if (status === "all") {
    // Conteo total (DB)
    const total = await db.track.count({ where });

    // Paginación (DB)
    const skip = (page - 1) * pageSize;
    const rows = await db.track.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: baseSelect,
    });

    const enriched = rows.map((r) => ({ ...r, __status: deriveStatus(r) }));
    return (
      <OverviewUI
        rows={enriched}
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
        status={status}
        sort={sort}
      />
    );
  }

  // Estado ≠ "all" → recuperamos todos los que calzan la búsqueda y orden (sin paginar)
  // Peras y manzanas: así evitamos los filtros con null en `count`.
  const all = await db.track.findMany({
    where,
    orderBy,
    select: baseSelect,
  });

  const withStatus = all.map((r) => ({ ...r, __status: deriveStatus(r) }));
  const onlyStatus = withStatus.filter(predicateFromStatus(status));

  // Conteo real tras filtro
  const total = onlyStatus.length;

  // Paginación en memoria
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = onlyStatus.slice(start, end);

  return (
    <OverviewUI
      rows={pageRows}
      total={total}
      page={page}
      pageSize={pageSize}
      q={q}
      status={status}
      sort={sort}
    />
  );
}

/* ============================
 * UI (tabla, filtros, etc.)
 * ============================ */

function OverviewUI({
  rows,
  total,
  page,
  pageSize,
  q,
  status,
  sort,
}: {
  rows: (Row & { __status: Status })[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  status: string;
  sort: string;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Overview de análisis</h1>
        <Link
          href="/admin/tracks"
          className="text-sm text-indigo-600 hover:underline"
        >
          Ir a listado de tracks →
        </Link>
      </header>

      {/* Ejecutar por ID (mantiene tu flujo) */}
      <section className="rounded border border-gray-200 p-4">
        <h2 className="mb-2 text-lg font-medium">Analizar por ID</h2>
        <p className="mb-3 text-sm text-gray-500">
          Pega un <code>Track ID</code> y ejecuta el analizador técnico
          (opcionalmente con normalización de asset).
        </p>
        <AnalyzeByIdForm />
      </section>

      {/* Filtros / orden / búsqueda */}
      <FilterBar
        initial={{ q, status, sort, page }}
        total={total}
        pageSize={pageSize}
      />

      {/* Tabla */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Track</Th>
              <Th className="hidden md:table-cell">LUFS</Th>
              <Th className="hidden md:table-cell">LRA</Th>
              <Th className="hidden md:table-cell">TP</Th>
              <Th>Estado</Th>
              <Th className="hidden lg:table-cell">Asset</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <Td>
                  <div className="font-medium">{t.title ?? "Sin título"}</div>
                  <div className="text-gray-500">
                    {t.artist ?? "Sin artista"}
                  </div>
                  <div className="text-[11px] text-gray-400">ID: {t.id}</div>
                </Td>
                <Td className="hidden md:table-cell">
                  {fmtMaybe(t.loudnessLufs)}
                </Td>
                <Td className="hidden md:table-cell">
                  {fmtMaybe(t.loudnessRangeLu)}
                </Td>
                <Td className="hidden md:table-cell">
                  {fmtMaybe(t.truePeakDbfs)}
                </Td>
                <Td>
                  <StatusChips status={t.__status} />
                </Td>
                <Td className="hidden lg:table-cell">
                  {t.assetKey ? (
                    <div className="text-xs">
                      <div className="font-mono break-all">{t.assetKey}</div>
                      <div className="text-gray-500">
                        {t.assetMime ?? "—"} ·{" "}
                        {t.assetSize != null ? formatBytes(t.assetSize) : "—"}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Sin asset normalizado
                    </span>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AnalyzeActions id={t.id} />
                    <Link
                      href={`/admin/track/${t.id}/tech`}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Ficha
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No hay resultados para los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
        status={status}
        sort={sort}
      />
    </div>
  );
}

/* ============================
 * Subcomponentes UI sencillos
 * ============================ */

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 text-left font-medium text-gray-600 ${className}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}

function StatusChips({ status }: { status: Status }) {
  if (status.kind === "ok") return <Chip color="emerald">Analizado</Chip>;
  if (status.kind === "needs")
    return <Chip color="rose">Falta normalización</Chip>;
  return <Chip color="amber">Faltan datos</Chip>;
}
function Chip({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "emerald" | "amber" | "rose";
}) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-900",
    amber: "bg-amber-100 text-amber-900",
    rose: "bg-rose-100 text-rose-900",
  } as const;
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs ${map[color]}`}>
      {children}
    </span>
  );
}
function fmtMaybe(v: number | null) {
  return v == null || !isFinite(v) ? "—" : Number(v).toFixed(2);
}

/**
 * Barra de filtros
 */
function FilterBar({
  initial,
  total,
  pageSize,
}: {
  initial: { q: string; status: string; sort: string; page: number };
  total: number;
  pageSize: number;
}) {
  const { q, status, sort, page } = initial;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <form
      method="GET"
      className="flex flex-col gap-2 rounded border border-gray-200 p-3 md:flex-row md:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs text-gray-500">Buscar</label>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Título, artista o ID exacto"
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">Estado</label>
        <select
          name="status"
          defaultValue={status}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">Todos</option>
          <option value="ok">Analizado</option>
          <option value="missing">Faltan datos</option>
          <option value="needs">Falta normalización</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">Orden</label>
        <select
          name="sort"
          defaultValue={sort}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="updated_desc">Actualizado ↓</option>
          <option value="updated_asc">Actualizado ↑</option>
          <option value="created_desc">Creado ↓</option>
          <option value="created_asc">Creado ↑</option>
          <option value="lufs_desc">LUFS ↓</option>
          <option value="lufs_asc">LUFS ↑</option>
        </select>
      </div>

      <input type="hidden" name="page" value="1" />
      <button
        type="submit"
        className="self-start rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 md:self-auto"
        title="Aplicar filtros"
      >
        Aplicar
      </button>

      <div className="ml-auto text-xs text-gray-500">
        {total === 0 ? "0 resultados" : `${from}–${to} de ${total}`}
      </div>
    </form>
  );
}

/** Paginación simple por querystring */
function Pagination({
  total,
  page,
  pageSize,
  q,
  status,
  sort,
}: {
  total: number;
  page: number;
  pageSize: number;
  q: string;
  status: string;
  sort: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  function link(p: number) {
    const params = new URLSearchParams({ q, status, sort, page: String(p) });
    return `/admin/analyze?${params.toString()}`;
    // Nota “peras y manzanas”: mantenemos el resto de parámetros al navegar.
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">
        Página {Math.min(page, totalPages)} de {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={link(prev)}
          className={`rounded border px-3 py-1.5 ${
            page <= 1
              ? "pointer-events-none border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          ← Anterior
        </Link>
        <Link
          href={link(next)}
          className={`rounded border px-3 py-1.5 ${
            page >= totalPages
              ? "pointer-events-none border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Siguiente →
        </Link>
      </div>
    </div>
  );
}
