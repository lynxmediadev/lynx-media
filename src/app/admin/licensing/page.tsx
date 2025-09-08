// src/app/admin/licensing/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Listado de Solicitudes de Licencia (/admin/licensing)                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Panel con TODOS los filtros:                                              │
 * │   • Básicos: búsqueda (q), estado, responsable (assignee), orden, filas.    │
 * │   • Avanzados (plegables): desde/hasta, whitelist, MFN.                     │
 * │ - Muestra chips de filtros activos + botón “Limpiar todo”.                  │
 * │ - Tabla con badge de ESTADO y acciones por fila.                            │
 * │ - Next 15: `searchParams` asíncrono y helpers locales (fechas, moneda).     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import prisma from "@/lib/prisma";
import Link from "next/link";
import RowActions from "@/components/admin/RowActions";

export const dynamic = "force-dynamic";

/** Fecha/hora legible en es-CL */
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(d);
}

/** Moneda (CLP por defecto → 0 decimales si corresponde) */
function money(amount?: number | null, curr?: string | null) {
  if (!amount || !curr) return "—";
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: curr === "CLP" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${curr}`;
  }
}

/**
 * Helper: parseDateBoundary
 * Peras y manzanas:
 * - Recibe una fecha "YYYY-MM-DD".
 * - Devuelve Date al inicio del día (end=false) o al final (end=true).
 * - Si la cadena es inválida, retorna undefined (se omite el filtro).
 */
function parseDateBoundary(s?: string, end = false): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return undefined;
  const dt = new Date(y, (m - 1) as number, d, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

/** Badge visual del estado (contraste sobrio) */
function StatusBadge({ v }: { v: string }) {
  const map: Record<string, string> = {
    NEW: "bg-neutral-500 text-white",
    IN_REVIEW: "bg-indigo-600 text-white",
    QUOTED: "bg-amber-600 text-white",
    CLOSED_WON: "bg-emerald-600 text-white",
    CLOSED_LOST: "bg-red-600 text-white",
  };
  const label: Record<string, string> = {
    NEW: "Nuevo",
    IN_REVIEW: "En gestión",
    QUOTED: "Cotizado",
    CLOSED_WON: "Cerrado (Ganado)",
    CLOSED_LOST: "Cerrado (Perdido)",
  };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${map[v] ?? "bg-neutral-500 text-white"}`}>{label[v] ?? v}</span>;
}

/** Chips legibles con filtros activos (para entender al tiro qué está aplicado) */
function activeFilterChips(opts: {
  q: string; from: string; to: string; whitelist: string; mfn: string; status: string; assignee: string;
}) {
  const chips: string[] = [];
  if (opts.q) chips.push(`q:“${opts.q}”`);
  if (opts.from) chips.push(`desde:${opts.from}`);
  if (opts.to) chips.push(`hasta:${opts.to}`);
  if (opts.whitelist === "1") chips.push("whitelist:Sí");
  if (opts.mfn === "1") chips.push("MFN:Sí");
  if (opts.status) chips.push(`estado:${opts.status}`);
  if (opts.assignee) chips.push(`owner:“${opts.assignee}”`);
  return chips;
}

type SP = Record<string, string | string[] | undefined>;

// ⬇️ Next 15: searchParams es Promise<...>, hay que await
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const get1 = (v: string | string[] | undefined) => (typeof v === "string" ? v : Array.isArray(v) ? v[0] : "");

  // ───────── Filtros (URL → variables) ─────────
  const q = get1(sp.q).trim();
  const from = get1(sp.from);
  const to = get1(sp.to);
  const whitelist = get1(sp.whitelist); // "1" => true
  const mfn = get1(sp.mfn);             // "1" => true

  const order = (get1(sp.order) || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const status = get1(sp.status).toUpperCase(); // "", "NEW", ...
  const assignee = get1(sp.assignee).trim();

  const takeRaw = get1(sp.take);
  const takeNum = Number.parseInt(takeRaw || "50", 10);
  const take = Math.min(Math.max(Number.isFinite(takeNum) ? takeNum : 50, 1), 200);

  // Chips UX
  const chips = activeFilterChips({ q, from, to, whitelist, mfn, status, assignee });
  const hasActive = chips.length > 0;

  // ───────── Prisma where ─────────
  const where: any = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { projectType: { contains: q, mode: "insensitive" } },
          { trackTitle: { contains: q, mode: "insensitive" } },
          { trackArtist: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  // Fechas (creación)
  const gte = parseDateBoundary(from, false);
  const lte = parseDateBoundary(to, true);
  if (gte || lte) {
    where.createdAt = {};
    if (gte) where.createdAt.gte = gte;
    if (lte) where.createdAt.lte = lte;
  }

  // Flags
  if (whitelist === "1") where.needWhitelist = true;
  if (mfn === "1") where.mfn = true;

  // Estado (enum) y responsable (contains)
  const ALLOWED = new Set(["NEW", "IN_REVIEW", "QUOTED", "CLOSED_WON", "CLOSED_LOST"]);
  if (status && ALLOWED.has(status)) where.status = status;
  if (assignee) where.assignee = { contains: assignee, mode: "insensitive" };

  // ───────── Data ─────────
  let rows:
    | Awaited<ReturnType<typeof prisma.licensingRequest.findMany>>
    | [] = [];
  let filteredCount = 0;
  let totalCount = 0;
  let loadError: unknown = null;

  try {
    const [list, cFiltered, cTotal] = await Promise.all([
      prisma.licensingRequest.findMany({ where, orderBy: { createdAt: order }, take }),
      prisma.licensingRequest.count({ where }),
      prisma.licensingRequest.count(),
    ]);
    rows = list;
    filteredCount = cFiltered;
    totalCount = cTotal;
  } catch (err) {
    console.error("[admin/licensing] query failed:", err);
    loadError = err;
  }

  // ───────── QS para botones (export/limpiar) ─────────
  const currentParams = new URLSearchParams();
  if (q) currentParams.set("q", q);
  if (from) currentParams.set("from", from);
  if (to) currentParams.set("to", to);
  if (whitelist === "1") currentParams.set("whitelist", "1");
  if (mfn === "1") currentParams.set("mfn", "1");
  if (status) currentParams.set("status", status);
  if (assignee) currentParams.set("assignee", assignee);
  currentParams.set("order", order);
  currentParams.set("take", String(take));

  // Abrir “avanzados” si ya hay algo aplicado
  const advancedOpen = Boolean(from || to || whitelist === "1" || mfn === "1");

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <header className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-end gap-4">
          <h1 className="text-2xl font-semibold leading-tight">Solicitudes de Licencia</h1>
          <div className="ml-auto flex gap-3 text-sm">
            <div className="rounded-md border border-border bg-muted px-3 py-1.5">
              <span className="text-muted-foreground">Filtrados:</span>{" "}
              <span className="font-medium">{filteredCount}</span>
            </div>
            <div className="rounded-md border border-border bg-muted px-3 py-1.5">
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-medium">{totalCount}</span>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mt-4 rounded-md border border-red-400 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
            No se pudo cargar desde la base de datos. Verifica migraciones y Prisma Client.
          </div>
        )}

        {/* Chips de filtros activos */}
        {hasActive && (
          <div className="mt-4 rounded-lg border border-border bg-muted/60 p-3 text-sm">
            <div className="mb-2 text-muted-foreground">Filtros activos:</div>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <span key={c} className="rounded bg-card px-2 py-0.5">
                  {c}
                </span>
              ))}
              <Link
                href="/admin/licensing"
                className="ml-auto rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent"
              >
                Limpiar todo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Filtros: básicos y avanzados */}
      <form className="mb-6 rounded-2xl border border-border bg-card p-6">
        {/* Básicos */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Búsqueda</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="email, nombre, empresa, proyecto, título, artista…"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Estado</label>
            <select
              name="status"
              defaultValue={status || ""}
              className="min-w-[12rem] w-full whitespace-nowrap rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="NEW">Nuevo</option>
              <option value="IN_REVIEW">En gestión</option>
              <option value="QUOTED">Cotizado</option>
              <option value="CLOSED_WON">Cerrado (Ganado)</option>
              <option value="CLOSED_LOST">Cerrado (Perdido)</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Responsable</label>
            <input
              name="assignee"
              defaultValue={assignee}
              placeholder="Nombre o email…"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Orden</label>
            <select
              name="order"
              defaultValue={order}
              className="min-w-[12rem] w-full whitespace-nowrap rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="desc">Más recientes</option>
              <option value="asc">Más antiguas</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Filas</label>
            <select
              name="take"
              defaultValue={String(take)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[25, 50, 100, 150, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Avanzados (plegables) */}
        <details className="mt-5 group" open={advancedOpen}>
          <summary className="cursor-pointer select-none rounded-md px-1 py-1 text-sm text-muted-foreground hover:text-foreground">
            {advancedOpen ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Desde (fecha)</label>
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Hasta (fecha)</label>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="lg:col-span-6">
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Flags</label>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                  <input type="checkbox" name="whitelist" value="1" defaultChecked={whitelist === "1"} />
                  Whitelist
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                  <input type="checkbox" name="mfn" value="1" defaultChecked={mfn === "1"} />
                  MFN
                </label>
              </div>
            </div>
          </div>
        </details>

        {/* Acciones */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            Filtrar
          </button>
          <Link
            href="/admin/licensing"
            className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpiar
          </Link>
          <a
            href={`/admin/licensing/export?${currentParams.toString()}&limit=2000`}
            className="ml-auto rounded-lg border border-border bg-muted px-4 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            Exportar CSV
          </a>
        </div>
      </form>

      {/* Tabla */}
      <div className="relative overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-[0.95rem] leading-relaxed">
          <thead className="sticky top-0 z-10 bg-muted/90 text-left backdrop-blur">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Track</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/50">
                <td className="whitespace-nowrap px-4 py-3 align-top">{fmtDate(r.createdAt)}</td>

                <td className="px-4 py-3 align-top">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-muted-foreground">{r.email}</div>
                  {r.company && <div className="text-muted-foreground">{r.company}</div>}
                  {r.assignee && <div className="text-muted-foreground">Owner: {r.assignee}</div>}
                </td>

                <td className="px-4 py-3 align-top">
                  <div>{r.projectType}{r.media ? ` · ${r.media}` : ""}</div>
                  <div className="text-muted-foreground">{r.territories || "—"} · {r.term || "—"}</div>
                  <div className="text-muted-foreground">{money(r.budgetAmount, r.budgetCurrency)}</div>
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="font-medium">{r.trackTitle || "—"}</div>
                  <div className="text-muted-foreground">{r.trackArtist || "—"} · ID: {r.trackId}</div>
                  <div className="text-muted-foreground">
                    {(r.moods || []).slice(0, 3).join(", ") || "—"}
                    {r.uses?.length ? ` · ${r.uses.slice(0, 3).join(", ")}` : ""}
                  </div>
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center gap-1">
                    <StatusBadge v={(r as any).status ?? "NEW"} />
                    <span className={`rounded px-2 py-0.5 text-xs ${r.mfn ? "bg-emerald-600 text-white" : "bg-muted"}`}>MFN {r.mfn ? "Sí" : "No"}</span>
                    <span className={`rounded px-2 py-0.5 text-xs ${r.needWhitelist ? "bg-indigo-600 text-white" : "bg-muted"}`}>Whitelist {r.needWhitelist ? "Sí" : "No"}</span>
                  </div>
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center gap-1">
                    <Link
                      href={`/admin/licensing/${r.id}`}
                      className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Ver
                    </Link>
                    <RowActions
                      id={r.id}
                      createdAtISO={r.createdAt.toISOString()}
                      name={r.name}
                      email={r.email}
                      company={r.company ?? ""}
                      projectType={r.projectType}
                      media={r.media ?? ""}
                      territories={r.territories ?? ""}
                      term={r.term ?? ""}
                      budgetAmount={r.budgetAmount ?? null}
                      budgetCurrency={r.budgetCurrency ?? null}
                      trackTitle={r.trackTitle ?? ""}
                      trackArtist={r.trackArtist ?? ""}
                      trackId={r.trackId}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {loadError
                    ? "Error al cargar datos. Revisa migraciones y Prisma Client."
                    : hasActive
                    ? <>Sin resultados para los filtros actuales.{" "}
                        <Link href="/admin/licensing" className="underline underline-offset-2">Limpiar filtros</Link>.
                      </>
                    : "Sin resultados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {rows.length} de {filteredCount} resultados{q ? ` para “${q}”` : ""}.
      </div>
    </main>
  );
}
