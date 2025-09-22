// src/app/admin/insights/page.tsx
/**
 * /admin/insights — Tablero mínimo de métricas (compatible con más versiones de Prisma)
 * Peras y manzanas:
 * - Antes intentábamos `orderBy: { _count: { _all: 'desc' } }` en groupBy.
 *   Algunas versiones de Prisma no lo soportan ⇒ error.
 * - Solución portable: quitamos `orderBy` en Prisma y ORDENAMOS EN JS
 *   por `r._count._all` después de recibir los resultados.
 * - Mostramos: Total, por Estado, por Prioridad, Top Tracks (10).
 * - Misma UI sobria/cine; export CSV conserva el filtro activo.
 */
import prisma from "@/lib/prisma";
import { parseDateBoundary } from "@/lib/dates";
import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 1) Rango de fechas (default: últimos 30 días)
  const sp = await searchParams;
  const fromParam = (sp.from as string) || "";
  const toParam = (sp.to as string) || "";

  const today = new Date();
  const defaultTo = new Date(today);
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const gte = parseDateBoundary(fromParam || defaultFrom.toISOString().slice(0, 10), false);
  const lte = parseDateBoundary(toParam || defaultTo.toISOString().slice(0, 10), true);

  // 2) Filtro base
  const where = {
    ...(gte || lte
      ? {
          createdAt: {
            ...(gte ? { gte } : {}),
            ...(lte ? { lte } : {}),
          },
        }
      : {}),
  } as const;

  // 3) Agregados Prisma (SIN orderBy) + orden en memoria
  const [total, byStatusRaw, byPriorityRaw, topTracksRaw] = await Promise.all([
    prisma.licensingRequest.count({ where }),

    prisma.licensingRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
      where,
    }),

    prisma.licensingRequest.groupBy({
      by: ["priority"],
      _count: { _all: true },
      where,
    }),

    prisma.licensingRequest.groupBy({
      by: ["trackId", "trackTitle", "trackArtist"],
      _count: { _all: true },
      where,
    }),
  ]);

  // Ordenar por cantidad (desc) en JS
  const byStatus = byStatusRaw.sort((a, b) => b._count._all - a._count._all);
  const byPriority = byPriorityRaw.sort((a, b) => b._count._all - a._count._all);
  const topTracks = topTracksRaw.sort((a, b) => b._count._all - a._count._all).slice(0, 10);

  // 4) URL de export con el mismo filtro
  const qs = new URLSearchParams();
  if (fromParam) qs.set("from", fromParam);
  if (toParam) qs.set("to", toParam);
  const exportHref = `/admin/insights/export${qs.toString() ? `?${qs.toString()}` : ""}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      {/* Encabezado + filtros */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Insights (Licensing)</h1>
          <p className="text-sm text-muted-foreground">
            Rango: {gte?.toISOString().slice(0, 10)} → {lte?.toISOString().slice(0, 10)}.
          </p>
        </div>

        <form method="GET" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Desde</label>
            <input
              type="date"
              name="from"
              defaultValue={fromParam || defaultFrom.toISOString().slice(0, 10)}
              className="rounded-lg border border-border bg-muted px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <input
              type="date"
              name="to"
              defaultValue={toParam || defaultTo.toISOString().slice(0, 10)}
              className="rounded-lg border border-border bg-muted px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col justify-end">
            <button className="rounded-lg border border-border bg-muted px-3 py-2 text-sm hover:bg-accent">
              Aplicar
            </button>
          </div>
        </form>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Total solicitudes</p>
          <p className="mt-1 text-3xl font-semibold">{total}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Estados</p>
          <ul className="mt-2 space-y-1 text-sm">
            {byStatus.map((s) => (
              <li key={String(s.status)} className="flex justify-between">
                <span className="text-muted-foreground">{String(s.status)}</span>
                <span className="font-medium">{s._count._all}</span>
              </li>
            ))}
            {!byStatus.length && <li className="text-muted-foreground">—</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Prioridades</p>
          <ul className="mt-2 space-y-1 text-sm">
            {byPriority.map((p) => (
              <li key={String(p.priority)} className="flex justify-between">
                <span className="text-muted-foreground">{String(p.priority)}</span>
                <span className="font-medium">{p._count._all}</span>
              </li>
            ))}
            {!byPriority.length && <li className="text-muted-foreground">—</li>}
          </ul>
        </div>
      </section>

      {/* Top Tracks */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top Tracks más solicitados</h2>
          <Link
            href={exportHref}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm hover:bg-accent"
          >
            Export CSV (agregado)
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Track</th>
                <th className="py-2 pr-4">Artista</th>
                <th className="py-2">Solicitudes</th>
              </tr>
            </thead>
            <tbody>
              {topTracks.map((t, i) => (
                <tr key={`${t.trackId}-${i}`} className="border-t border-border/60">
                  <td className="py-2 pr-4">{i + 1}</td>
                  <td className="py-2 pr-4">{t.trackTitle || t.trackId}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{t.trackArtist || "—"}</td>
                  <td className="py-2">{t._count._all}</td>
                </tr>
              ))}
              {!topTracks.length && (
                <tr className="border-t border-border/60">
                  <td className="py-3 text-muted-foreground" colSpan={4}>
                    Sin datos en el rango.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
