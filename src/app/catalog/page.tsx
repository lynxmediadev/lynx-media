// src/app/catalog/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/catalog/page.tsx                                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace (peras y manzanas)                                                │
 * │ - Renderiza el Catálogo público con:                                       │
 * │   • Búsqueda por texto (q) en título/artista (case-insensitive).           │
 * │   • Filtros múltiples por moods[] y uses[] (OR semántico: hasSome).        │
 * │   • Filtro opcional por duración en segundos [durMin–durMax].              │
 * │   • Orden configurable: createdAt/title/artist/duration (asc/desc).        │
 * │   • Paginación estable (page/per) y estado en la URL (GET).                │
 * │ - Mantiene la estética “cine” + mini-player con forma de onda.             │
 * │ - No rompe lo ya funcionando; todo vive en este archivo.                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Cómo usar                                                                  │
 * │ - Navegar a /catalog. Usar el formulario superior para filtrar/ordenar.    │
 * │ - La URL conserva parámetros (compartible/enlazable).                      │
 * │ - Si necesitas más facetas, replica el patrón de where/orderBy.            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Decisiones clave                                                            │
 * │ - Facetas (moods/uses) dinámicas: se agregan desde BD (take=1000)          │
 * │   para evitar scans completos en catálogos grandes.                         │
 * │ - Prisma v6 arrays → { hasSome: [] } para OR entre múltiples selecciones.   │
 * │ - Next 15: se usa `await searchParams` para compat en server components.    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import Link from "next/link";
import { Buffer } from "buffer"; // asegura Buffer en RSC/edge
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

// Importa tu mini-player existente (se mantiene igual)
import TrackCardWavePlayer from "@/components/public/TrackCardWavePlayer";


// ───────────────────────────────────────────────────────────────────────────────
// Config general
// ───────────────────────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

type SPVal = string | string[] | undefined;
type SPSafe = {
  q?: string;
  moods?: string[];
  uses?: string[];
  durMin?: number | null; // segundos
  durMax?: number | null; // segundos
  sort?: string; // created_desc (default), created_asc, title_asc|desc, artist_asc|desc, duration_asc|desc
  page?: number; // 1-based
  per?: number; // items por página (12 default)
};

// Orden soportado -> Prisma orderBy
function orderByFromSort(
  sort: string | undefined,
): Prisma.TrackOrderByWithRelationInput {
  switch (sort) {
    case "created_asc":
      return { createdAt: "asc" };
    case "title_asc":
      return { title: "asc" };
    case "title_desc":
      return { title: "desc" };
    case "artist_asc":
      return { artist: "asc" };
    case "artist_desc":
      return { artist: "desc" };
    case "duration_asc":
      return { durationSec: "asc" };
    case "duration_desc":
      return { durationSec: "desc" };
    case "created_desc":
    default:
      return { createdAt: "desc" };
  }
}

// Texto → where OR título/artista (case-insensitive)
function whereFromQ(q?: string): Prisma.TrackWhereInput {
  if (!q) return {};
  return {
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { artist: { contains: q, mode: "insensitive" } },
    ],
  };
}

// Arrays → { hasSome: [] } (OR semántico entre selecciones)
function whereFromArray(
  name: "moods" | "uses",
  vals?: string[],
): Prisma.TrackWhereInput {
  if (!vals || vals.length === 0) return {};
  return { [name]: { hasSome: vals } } as Prisma.TrackWhereInput;
}

// Rango de duración (segundos)
function whereFromDuration(
  min?: number | null,
  max?: number | null,
): Prisma.TrackWhereInput {
  const cond: Prisma.IntFilter = {};
  if (typeof min === "number" && Number.isFinite(min))
    cond.gte = Math.max(0, Math.floor(min));
  if (typeof max === "number" && Number.isFinite(max))
    cond.lte = Math.max(0, Math.floor(max));
  if (Object.keys(cond).length === 0) return {};
  return { durationSec: cond };
}

// Normalizadores de searchParams (Next puede entregar string|string[])
function toArray(v: SPVal): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string" && v.trim() !== "") return [v.trim()];
  return [];
}
function toInt(v: SPVal, fallback: number): number {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function toFloatOrNull(v: SPVal): number | null {
  if (typeof v !== "string") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

// Construye `where` combinando todas las piezas
function buildWhere(sp: SPSafe): Prisma.TrackWhereInput {
  return {
    AND: [
      whereFromQ(sp.q),
      whereFromArray("moods", sp.moods),
      whereFromArray("uses", sp.uses),
      whereFromDuration(sp.durMin, sp.durMax),
    ],
  };
}

// Construye URL preservando params actuales + overrides (para paginación/orden)
function urlWith(
  base: string,
  sp: Record<string, SPVal>,
  overrides: Record<string, string | number | null>,
) {
  const params = new URLSearchParams();
  const push = (k: string, value: string | number) =>
    params.append(k, String(value));
  const getAll = (k: string): string[] => {
    const v = sp[k];
    return Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
  };

  // conservar todos los existentes primero
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => push(k, x));
    else if (typeof v === "string") push(k, v);
  }

  // aplicar overrides (si === null eliminar la key)
  for (const [k, v] of Object.entries(overrides)) {
    params.delete(k);
    if (v !== null && v !== undefined && v !== "") push(k, v);
  }

  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

// ───────────────────────────────────────────────────────────────────────────────
// Página (Server Component)
// ───────────────────────────────────────────────────────────────────────────────
export default async function CatalogPage({
  searchParams,
}: {
  // Next 15 puede entregar Promise en server components
  searchParams?: Promise<Record<string, SPVal>>;
}) {
  const raw = (await searchParams) ?? {};

  // Normalizar search params
  const sp: SPSafe = {
    q: typeof raw.q === "string" ? raw.q.trim() : undefined,
    moods: toArray(raw.moods),
    uses: toArray(raw.uses),
    durMin: toFloatOrNull(raw.durMin),
    durMax: toFloatOrNull(raw.durMax),
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    page: toInt(raw.page, 1),
    per: Math.min(48, toInt(raw.per, 12)), // cap 48 para no sobrecargar UI
  };

  // Facetas dinámicas livianas (derivadas de BD, cap a 1000 filas)
  // Nota: esto evita hardcodear listas y mantiene la UI cercana a los datos reales
  const facetRows = await db.track.findMany({
    select: { moods: true, uses: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const allMoods = uniq(sortLex(flatten(facetRows.map((r) => r.moods ?? []))));
  const allUses = uniq(sortLex(flatten(facetRows.map((r) => r.uses ?? []))));

  // Query principal (where + order + paginación)
  const where = buildWhere(sp);
  const orderBy = orderByFromSort(sp.sort);

  // total para paginación
  const total = await db.track.count({ where });

  const page = Math.max(1, sp.page ?? 1);
  const per = Math.max(1, sp.per ?? 12);
  const totalPages = Math.max(1, Math.ceil(total / per));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * per;

  const tracks = await db.track.findMany({
    where,
    orderBy,
    skip,
    take: per,
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      durationSec: true,
      moods: true,
      uses: true,
      restrictions: true,
      waveform: true,
    },
  });

  // Render
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Encabezado */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Catálogo
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Explora el catálogo. Usa los filtros para encontrar música adecuada a
          tu proyecto.
        </p>
      </header>

      {/* FILTROS (GET form para conservar estado en URL) */}
      <FiltersForm
        allMoods={allMoods}
        allUses={allUses}
        current={raw}
        total={total}
      />

      {/* Estado vacío */}
      {tracks.length === 0 ? (
        <div className="mt-10 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-8 text-center text-zinc-400">
          No se encontraron resultados con los filtros aplicados.
        </div>
      ) : (
        <>
          {/* Grilla de tarjetas */}
          <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t) => {
              // waveform Bytes → base64 para el canvas del client component
              const waveformB64 =
                t.waveform && (t.waveform as unknown as Uint8Array).length > 0
                  ? Buffer.from(t.waveform as unknown as Uint8Array).toString(
                      "base64",
                    )
                  : null;

              return (
                <article
                  key={t.id}
                  className="group flex flex-col rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700"
                >
                  {/* Cabecera */}
                  <div className="mb-3 flex items-baseline gap-2">
                    <h2 className="flex-1 truncate text-base font-semibold text-zinc-100">
                      {t.title ?? "Untitled"}
                    </h2>
                    <span className="text-xs text-zinc-500">
                      {formatDuration(t.durationSec)}
                    </span>
                  </div>
                  <div className="mb-3 text-sm text-zinc-400">
                    {t.artist ?? "—"}
                  </div>

                  {/* Mini-player con forma de onda */}
                  <div className="mb-3">
                    {" "}
                    <TrackCardWavePlayer
                      src={t.audioUrl ?? undefined}
                      durationSec={t.durationSec ?? undefined}
                      waveformB64={waveformB64 ?? null}
                    />
                  </div>

                  {/* Chips / etiquetas */}
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(t.moods) &&
                        t.moods.slice(0, 6).map((m, i) => (
                          <Chip key={`m-${t.id}-${i}`} kind="mood">
                            {m}
                          </Chip>
                        ))}
                      {Array.isArray(t.uses) &&
                        t.uses.slice(0, 6).map((u, i) => (
                          <Chip key={`u-${t.id}-${i}`} kind="use">
                            {u}
                          </Chip>
                        ))}
                    </div>
                    {Array.isArray(t.restrictions) &&
                      t.restrictions.length > 0 && (
                        <div className="mt-2 text-xs text-zinc-500">
                          Restricciones: {t.restrictions.join(", ")}
                        </div>
                      )}
                  </div>

                  {/* CTA a ficha pública */}
                  <div className="mt-4">
                    <Link
                      href={`/track/${t.id}`}
                      className="inline-flex items-center rounded-md border border-zinc-700/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800/50"
                    >
                      Ver ficha
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Paginación */}
          <Pagination
            raw={raw}
            page={safePage}
            per={per}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// UI aux: Filtros, Chip, Paginación  (sólo JSX/HTML con clases Tailwind)
// ───────────────────────────────────────────────────────────────────────────────

function FiltersForm({
  allMoods,
  allUses,
  current,
  total,
}: {
  allMoods: string[];
  allUses: string[];
  current: Record<string, SPVal>;
  total: number;
}) {
  // Helpers para “checked/valor actual” en GET form sin JS
  const checked = (k: string, v: string) => {
    const curr = current[k];
    if (Array.isArray(curr)) return curr.includes(v);
    return curr === v;
  };
  const value = (k: string) =>
    typeof current[k] === "string" ? (current[k] as string) : "";

  return (
    <form
      method="get"
      className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4"
    >
      {/* Fila 1: búsqueda + orden + totales */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs tracking-wide text-zinc-400 uppercase">
            Buscar
          </label>
          <input
            type="text"
            name="q"
            defaultValue={value("q")}
            placeholder="Título o artista"
            className="mt-1 w-full rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500"
          />
        </div>

        <div>
          <label className="block text-xs tracking-wide text-zinc-400 uppercase">
            Duración (segundos)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              name="durMin"
              min={0}
              step={1}
              defaultValue={value("durMin")}
              placeholder="mín"
              className="w-24 rounded-md border border-zinc-700/60 bg-zinc-900 px-2 py-2 text-zinc-100 placeholder-zinc-500"
            />
            <input
              type="number"
              name="durMax"
              min={0}
              step={1}
              defaultValue={value("durMax")}
              placeholder="máx"
              className="w-24 rounded-md border border-zinc-700/60 bg-zinc-900 px-2 py-2 text-zinc-100 placeholder-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs tracking-wide text-zinc-400 uppercase">
            Orden
          </label>
          <select
            name="sort"
            defaultValue={value("sort") || "created_desc"}
            className="mt-1 w-48 rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100"
          >
            <option value="created_desc">Nuevos primero</option>
            <option value="created_asc">Antiguos primero</option>
            <option value="title_asc">Título A–Z</option>
            <option value="title_desc">Título Z–A</option>
            <option value="artist_asc">Artista A–Z</option>
            <option value="artist_desc">Artista Z–A</option>
            <option value="duration_asc">Duración ↑</option>
            <option value="duration_desc">Duración ↓</option>
          </select>
        </div>

        <div>
          <label className="block text-xs tracking-wide text-zinc-400 uppercase">
            Por página
          </label>
          <select
            name="per"
            defaultValue={value("per") || "12"}
            className="mt-1 w-24 rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100"
          >
            <option value="12">12</option>
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="36">36</option>
            <option value="48">48</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-zinc-500">Resultados: {total}</div>
      </div>

      {/* Fila 2: MOODS */}
      <div className="mt-4">
        <div className="mb-2 text-xs tracking-wide text-zinc-400 uppercase">
          Moods
        </div>
        <div className="flex flex-wrap gap-2">
          {allMoods.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${checked("moods", m) ? "border-zinc-300 text-zinc-100" : "border-zinc-700/60 text-zinc-400 hover:border-zinc-600"}`}
            >
              <input
                type="checkbox"
                name="moods"
                value={m}
                defaultChecked={checked("moods", m)}
                className="sr-only"
              />
              {m}
            </label>
          ))}
        </div>
      </div>

      {/* Fila 3: USES */}
      <div className="mt-3">
        <div className="mb-2 text-xs tracking-wide text-zinc-400 uppercase">
          Usos
        </div>
        <div className="flex flex-wrap gap-2">
          {allUses.map((u) => (
            <label
              key={u}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${checked("uses", u) ? "border-zinc-300 text-zinc-100" : "border-zinc-700/60 text-zinc-400 hover:border-zinc-600"}`}
            >
              <input
                type="checkbox"
                name="uses"
                value={u}
                defaultChecked={checked("uses", u)}
                className="sr-only"
              />
              {u}
            </label>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="inline-flex items-center rounded-md border border-zinc-700/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800/50"
        >
          Aplicar filtros
        </button>

        {/* Link para limpiar ⇒ borra todos los params */}
        <Link
          href="/catalog"
          className="inline-flex items-center rounded-md border border-zinc-800/60 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900/60"
        >
          Limpiar
        </Link>
      </div>
    </form>
  );
}

function Pagination({
  raw,
  page,
  per,
  totalPages,
}: {
  raw: Record<string, SPVal>;
  page: number;
  per: number;
  totalPages: number;
}) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  const prevHref = urlWith("/catalog", raw, { page: prev });
  const nextHref = urlWith("/catalog", raw, { page: next });

  return (
    <nav className="mt-8 flex items-center justify-center gap-2">
      <Link
        href={prevHref}
        className={`rounded border px-3 py-1.5 ${page <= 1 ? "pointer-events-none border-zinc-800/60 text-zinc-600" : "border-zinc-700/60 text-zinc-200 hover:bg-zinc-800/50"}`}
      >
        ← Anterior
      </Link>

      <span className="rounded border border-zinc-800/60 px-3 py-1.5 text-sm text-zinc-400">
        Página {page} / {totalPages}
      </span>

      <Link
        href={nextHref}
        className={`rounded border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none border-zinc-800/60 text-zinc-600" : "border-zinc-700/60 text-zinc-200 hover:bg-zinc-800/50"}`}
      >
        Siguiente →
      </Link>
    </nav>
  );
}

function Chip({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: "mood" | "use";
}) {
  // Pequeña variación de tono entre mood/use para jerarquía sutil
  const cls =
    kind === "mood"
      ? "border-zinc-700/60 text-zinc-300"
      : "border-zinc-700/40 text-zinc-400";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}
    >
      {children}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Utils locales
// ───────────────────────────────────────────────────────────────────────────────
function flatten<T>(arr: (T[] | null | undefined)[]): T[] {
  const out: T[] = [];
  for (const a of arr) if (Array.isArray(a)) out.push(...a);
  return out;
}
function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr)
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  return out;
}
function sortLex(arr: string[]): string[] {
  return [...arr].sort((a, b) => a.localeCompare(b));
}

// Valores seguros
function isFiniteNum(v: number | null | undefined): v is number {
  return typeof v === "number" && isFinite(v);
}
function formatDuration(sec: number | null | undefined) {
  if (!isFiniteNum(sec) || (sec as number) <= 0) return "0:00";
  const s = Math.round(sec as number);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
