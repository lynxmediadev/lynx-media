// src/app/admin/licensing/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Listado de Solicitudes — Pulidos finales (quick-filters + orden inteligente)│
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Quick-filters de follow-up: hoy / mañana / esta semana (lun-dom).         │
 * │ - Si no hay sortBy en la URL y hay follow-ups atrasados con los filtros     │
 * │   actuales → ordena por follow-up asc (los críticos arriba).                │
 * │ - Respeta: q, fechas de creación, whitelist, MFN, estado, owner, prioridad. │
 * │ - Si fuRange está activo, sobreescribe withFollowUp/overdue.                │
 * │ - Mantiene tu preview 📝 de internalNotes y la UI sobria.                   │
 * │ - Next 15: searchParams asíncrono.                                          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
// src/app/admin/licensing/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Listado de Solicitudes — KPIs internos y Panel de Pendientes (sin Slack)    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Calcula contadores: Overdue / Hoy / Mañana / Semana (lun–dom).            │
 * │ - Muestra una franja de KPIs y un "Panel de pendientes" (Top 10 overdue).   │
 * │ - Respeta filtros base (q, fechas de creación, flags, estado, owner, prio). │
 * │ - Mantiene quick-filters, orden inteligente y export CSV.                   │
 * │ - Next 15: searchParams asíncrono.                                          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import prisma from "@/lib/prisma";
import Link from "next/link";
import RowActions from "@/components/admin/RowActions";

export const dynamic = "force-dynamic";

// ────────────────────────────── Helpers de formato ─────────────────────────────
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(d);
}
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

// ────────────────────────────── Helpers de fechas ──────────────────────────────
function parseDateBoundary(s?: string, end = false): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return undefined;
  const dt = new Date(y, m - 1, d, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0); }
function endOfDay(d: Date)   { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999); }
function startOfWeekMon(d: Date) {
  const day = d.getDay(); // 0=Dom ... 1=Lun
  const diff = (day === 0 ? -6 : 1 - day); // mover a Lunes
  const base = new Date(d); base.setDate(d.getDate() + diff);
  return startOfDay(base);
}
function endOfWeekSun(d: Date) {
  const startMon = startOfWeekMon(d);
  const end = new Date(startMon); end.setDate(startMon.getDate() + 6);
  return endOfDay(end);
}

// ────────────────────────────── Badges y chips UI ──────────────────────────────
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
function PriorityBadge({ v }: { v: string }) {
  const map: Record<string, string> = {
    LOW: "bg-neutral-300 text-neutral-900 dark:bg-neutral-600 dark:text-white",
    MEDIUM: "bg-amber-600 text-white",
    HIGH: "bg-red-600 text-white",
  };
  const label: Record<string, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${map[v] ?? "bg-neutral-300"}`}>{label[v] ?? v}</span>;
}
function activeFilterChips(opts: {
  q: string; from: string; to: string; whitelist: string; mfn: string; status: string; assignee: string; prio: string; withFU: string; overdue: string; sortBy: string; fuRange: string;
}) {
  const chips: string[] = [];
  if (opts.q) chips.push(`q:“${opts.q}”`);
  if (opts.from) chips.push(`desde:${opts.from}`);
  if (opts.to) chips.push(`hasta:${opts.to}`);
  if (opts.whitelist === "1") chips.push("whitelist:Sí");
  if (opts.mfn === "1") chips.push("MFN:Sí");
  if (opts.status) chips.push(`estado:${opts.status}`);
  if (opts.assignee) chips.push(`owner:“${opts.assignee}”`);
  if (opts.prio) chips.push(`prio:${opts.prio}`);
  if (opts.withFU === "1") chips.push("conFollowUp");
  if (opts.overdue === "1") chips.push("atrasados");
  if (opts.fuRange) chips.push(`fu:${opts.fuRange}`);
  if (opts.sortBy === "followup") chips.push("ordenarPor:followUp");
  return chips;
}

type SP = Record<string, string | string[] | undefined>;
const get1 = (v: string | string[] | undefined) => (typeof v === "string" ? v : Array.isArray(v) ? v[0] : "");

// Construye URLSearchParams preservando filtros (útil para quick-filters)
function buildBaseParams(current: {
  q: string; from: string; to: string; whitelist: string; mfn: string; status: string; assignee: string; prio: string; withFU: string; overdue: string; order: string; sortBy: string; take: number; fuRange: string;
}) {
  const p = new URLSearchParams();
  if (current.q) p.set("q", current.q);
  if (current.from) p.set("from", current.from);
  if (current.to) p.set("to", current.to);
  if (current.whitelist === "1") p.set("whitelist", "1");
  if (current.mfn === "1") p.set("mfn", "1");
  if (current.status) p.set("status", current.status);
  if (current.assignee) p.set("assignee", current.assignee);
  if (current.prio) p.set("prio", current.prio);
  if (current.withFU === "1") p.set("withFollowUp", "1");
  if (current.overdue === "1") p.set("overdue", "1");
  if (current.sortBy) p.set("sortBy", current.sortBy);
  if (current.order) p.set("order", current.order);
  p.set("take", String(current.take));
  return p;
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  // ───────── Filtros (URL → variables) ─────────
  const q = (get1(sp.q) || "").trim();
  const from = get1(sp.from);
  const to = get1(sp.to);
  const whitelist = get1(sp.whitelist);
  const mfn = get1(sp.mfn);

  const status = (get1(sp.status) || "").toUpperCase();
  const assignee = (get1(sp.assignee) || "").trim();
  const prio = (get1(sp.prio) || "").toUpperCase(); // LOW|MEDIUM|HIGH|""

  const withFU = get1(sp.withFollowUp);
  const overdue = get1(sp.overdue);
  const fuRange = (get1(sp.fuRange) || "").toLowerCase(); // "today" | "tomorrow" | "week" | ""

  const orderParam = (get1(sp.order) || "desc").toLowerCase();
  const sortByParam = (get1(sp.sortBy) || "").toLowerCase(); // "created" | "followup" | ""

  const takeRaw = get1(sp.take);
  const takeNum = Number.parseInt(takeRaw || "50", 10);
  const take = Math.min(Math.max(Number.isFinite(takeNum) ? takeNum : 50, 1), 200);

  // Chips y bandera de filtros activos
  const chips = activeFilterChips({ q, from, to, whitelist, mfn, status, assignee, prio, withFU, overdue, sortBy: sortByParam || "", fuRange });
  const hasActive = chips.length > 0;

  // ───────── Prisma where (base sin follow-up) ─────────
  const whereBase: any = q
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

  const gte = parseDateBoundary(from, false);
  const lte = parseDateBoundary(to, true);
  if (gte || lte) {
    whereBase.createdAt = {};
    if (gte) whereBase.createdAt.gte = gte;
    if (lte) whereBase.createdAt.lte = lte;
  }
  if (whitelist === "1") whereBase.needWhitelist = true;
  if (mfn === "1") whereBase.mfn = true;
  const ST_ALLOWED = new Set(["NEW", "IN_REVIEW", "QUOTED", "CLOSED_WON", "CLOSED_LOST"]);
  if (status && ST_ALLOWED.has(status)) whereBase.status = status;
  const PR_ALLOWED = new Set(["LOW", "MEDIUM", "HIGH"]);
  if (prio && PR_ALLOWED.has(prio)) whereBase.priority = prio;
  if (assignee) whereBase.assignee = { contains: assignee, mode: "insensitive" };

  // ───────── Filtro de follow-up (fuRange/withFU/overdue) ─────────
  const now = new Date();
  const where: any = { ...whereBase };

  if (fuRange) {
    let gteFU: Date | undefined;
    let lteFU: Date | undefined;
    if (fuRange === "today") {
      gteFU = startOfDay(now);
      lteFU = endOfDay(now);
    } else if (fuRange === "tomorrow") {
      const t = new Date(now); t.setDate(now.getDate() + 1);
      gteFU = startOfDay(t);
      lteFU = endOfDay(t);
    } else if (fuRange === "week") {
      gteFU = startOfWeekMon(now);
      lteFU = endOfWeekSun(now);
    }
    where.nextFollowUpAt = {};
    if (gteFU) where.nextFollowUpAt.gte = gteFU;
    if (lteFU) where.nextFollowUpAt.lte = lteFU;
  } else if (overdue === "1") {
    where.nextFollowUpAt = { lt: now };
  } else if (withFU === "1") {
    where.nextFollowUpAt = { not: null };
  }

  // ───────── Orden inteligente (si no se especificó sortBy) ─────────
  let sortByUsed: "created" | "followup" = sortByParam === "followup" ? "followup" : "created";
  let orderUsed: "asc" | "desc" = orderParam === "asc" ? "asc" : "desc";

  if (!sortByParam) {
    const overdueWhere = { ...whereBase, nextFollowUpAt: { lt: now } };
    const overdueCountForDefault = await prisma.licensingRequest.count({ where: overdueWhere });
    if (overdueCountForDefault > 0) {
      sortByUsed = "followup";
      orderUsed = "asc";
    } else {
      sortByUsed = "created";
      orderUsed = "desc";
    }
  }

  const orderBy = sortByUsed === "followup"
    ? [{ nextFollowUpAt: orderUsed as any }, { createdAt: "desc" as const }]
    : [{ createdAt: orderUsed as any }];

  // ───────── Data principal y KPIs (nuevo) ─────────
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const tomorrowEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const weekStart = startOfWeekMon(now);
  const weekEnd = endOfWeekSun(now);

  let rows: Awaited<ReturnType<typeof prisma.licensingRequest.findMany>> | [] = [];
  let filteredCount = 0;
  let totalCount = 0;
  let kpiOverdue = 0, kpiToday = 0, kpiTomorrow = 0, kpiWeek = 0;
  let topOverdue: Awaited<ReturnType<typeof prisma.licensingRequest.findMany>> | [] = [];
  let loadError: unknown = null;

  try {
    const [
      list, cFiltered, cTotal,
      cOverdue, cToday, cTomorrow, cWeek,
      tOverdue
    ] = await Promise.all([
      prisma.licensingRequest.findMany({ where, orderBy, take }),
      prisma.licensingRequest.count({ where }),
      prisma.licensingRequest.count(),

      // KPIs: siempre sobre whereBase (respeta filtros base, no los de fuRange/overdue/withFU)
      prisma.licensingRequest.count({ where: { ...whereBase, nextFollowUpAt: { lt: now } } }),
      prisma.licensingRequest.count({ where: { ...whereBase, nextFollowUpAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.licensingRequest.count({ where: { ...whereBase, nextFollowUpAt: { gte: tomorrowStart, lte: tomorrowEnd } } }),
      prisma.licensingRequest.count({ where: { ...whereBase, nextFollowUpAt: { gte: weekStart, lte: weekEnd } } }),

      // Top 10 overdue (para el panel), también filtrado por whereBase
      prisma.licensingRequest.findMany({
        where: { ...whereBase, nextFollowUpAt: { lt: now } },
        orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
        take: 10,
      }),
    ]);

    rows = list;
    filteredCount = cFiltered;
    totalCount = cTotal;
    kpiOverdue = cOverdue;
    kpiToday = cToday;
    kpiTomorrow = cTomorrow;
    kpiWeek = cWeek;
    topOverdue = tOverdue;
  } catch (err) {
    console.error("[admin/licensing] query failed:", err);
    loadError = err;
  }

  // ───────── QS para export/limpiar/quick-filters ─────────
  const baseParams = buildBaseParams({
    q, from, to, whitelist, mfn, status, assignee, prio,
    withFU, overdue, order: orderUsed, sortBy: sortByUsed, take, fuRange,
  });

  const paramsToday = new URLSearchParams(baseParams.toString()); paramsToday.set("fuRange", "today"); paramsToday.set("withFollowUp", "1"); paramsToday.delete("overdue");
  const paramsTomorrow = new URLSearchParams(baseParams.toString()); paramsTomorrow.set("fuRange", "tomorrow"); paramsTomorrow.set("withFollowUp", "1"); paramsTomorrow.delete("overdue");
  const paramsWeek = new URLSearchParams(baseParams.toString()); paramsWeek.set("fuRange", "week"); paramsWeek.set("withFollowUp", "1"); paramsWeek.delete("overdue");
  const paramsOverdue = new URLSearchParams(baseParams.toString()); paramsOverdue.delete("fuRange"); paramsOverdue.set("overdue", "1"); paramsOverdue.set("withFollowUp", "1");
  const paramsClearFU = new URLSearchParams(baseParams.toString()); paramsClearFU.delete("fuRange"); paramsClearFU.delete("withFollowUp"); paramsClearFU.delete("overdue");

  const currentParams = new URLSearchParams(baseParams.toString());
  if (fuRange) currentParams.set("fuRange", fuRange);

  const advancedOpen = Boolean(from || to || whitelist === "1" || mfn === "1" || withFU === "1" || overdue === "1" || fuRange);

  // ────────────────────────────────────── UI ───────────────────────────────────
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <header className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-end gap-4">
          <h1 className="text-2xl font-semibold leading-tight">Solicitudes de Licencia</h1>
          <div className="ml-auto flex gap-3 text-sm">
            <div className="rounded-md border border-border bg-muted px-3 py-1.5">
              <span className="text-muted-foreground">Filtrados:</span> <span className="font-medium">{filteredCount}</span>
            </div>
            <div className="rounded-md border border-border bg-muted px-3 py-1.5">
              <span className="text-muted-foreground">Total:</span> <span className="font-medium">{totalCount}</span>
            </div>
          </div>
        </div>

        {/* KPIs de Follow-up (nuevo) */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <a href={`/admin/licensing?${paramsOverdue.toString()}`} className="rounded-lg border border-border bg-muted px-3 py-2 hover:bg-accent">
            <div className="text-muted-foreground text-[0.8rem]">Overdue</div>
            <div className="text-xl font-semibold">{kpiOverdue}</div>
          </a>
          <a href={`/admin/licensing?${paramsToday.toString()}`} className="rounded-lg border border-border bg-muted px-3 py-2 hover:bg-accent">
            <div className="text-muted-foreground text-[0.8rem]">Hoy</div>
            <div className="text-xl font-semibold">{kpiToday}</div>
          </a>
          <a href={`/admin/licensing?${paramsTomorrow.toString()}`} className="rounded-lg border border-border bg-muted px-3 py-2 hover:bg-accent">
            <div className="text-muted-foreground text-[0.8rem]">Mañana</div>
            <div className="text-xl font-semibold">{kpiTomorrow}</div>
          </a>
          <a href={`/admin/licensing?${paramsWeek.toString()}`} className="rounded-lg border border-border bg-muted px-3 py-2 hover:bg-accent">
            <div className="text-muted-foreground text-[0.8rem]">Esta semana</div>
            <div className="text-xl font-semibold">{kpiWeek}</div>
          </a>
          <a href={`/admin/licensing?${paramsClearFU.toString()}`} className="rounded-lg border border-border bg-muted px-3 py-2 hover:bg-accent">
            <div className="text-muted-foreground text-[0.8rem]">Limpiar rango</div>
            <div className="text-xl font-semibold">—</div>
          </a>
        </div>

        {/* Quick-filters (mantiene) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Follow-up rápido:</span>
          <a href={`/admin/licensing?${paramsToday.toString()}`} className={`rounded-md border px-2 py-1 hover:bg-accent ${fuRange==="today" ? "bg-card" : "bg-muted"} border-border`}>Hoy</a>
          <a href={`/admin/licensing?${paramsTomorrow.toString()}`} className={`rounded-md border px-2 py-1 hover:bg-accent ${fuRange==="tomorrow" ? "bg-card" : "bg-muted"} border-border`}>Mañana</a>
          <a href={`/admin/licensing?${paramsWeek.toString()}`} className={`rounded-md border px-2 py-1 hover:bg-accent ${fuRange==="week" ? "bg-card" : "bg-muted"} border-border`}>Esta semana</a>
          <a href={`/admin/licensing?${paramsOverdue.toString()}`} className={`rounded-md border px-2 py-1 hover:bg-accent ${overdue==="1" ? "bg-card" : "bg-muted"} border-border`}>Overdue</a>
          <a href={`/admin/licensing?${paramsClearFU.toString()}`} className="ml-2 rounded-md border border-border bg-muted px-2 py-1 hover:bg-accent">Quitar</a>
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
              {chips.map((c) => (<span key={c} className="rounded bg-card px-2 py-0.5">{c}</span>))}
              <Link href="/admin/licensing" className="ml-auto rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent">Limpiar todo</Link>
            </div>
          </div>
        )}

        {/* Panel de pendientes (nuevo) */}
        <details className="mt-4 group">
          <summary className="cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground">
            {kpiOverdue > 0 ? `Mostrar pendientes (${kpiOverdue})` : "No hay pendientes (overdue)"}
          </summary>
          {kpiOverdue > 0 && (
            <div className="mt-3 rounded-xl border border-border bg-muted/50 p-3">
              {topOverdue.map((r) => (
                <div key={r.id} className="flex flex-col gap-1 border-b border-border py-2 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground">{r.email}</span>
                    {r.assignee && <span className="text-muted-foreground">• Owner: {r.assignee}</span>}
                    <span className="ml-auto text-xs">{r.nextFollowUpAt ? new Date(r.nextFollowUpAt).toLocaleString("es-CL") : "—"}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.projectType}{r.media ? ` · ${r.media}` : ""} — {r.trackTitle || "—"} {r.trackArtist ? `· ${r.trackArtist}` : ""}
                  </div>
                  <div className="mt-1">
                    <Link prefetch={false} href={`/admin/licensing/${r.id}`} className="text-xs underline underline-offset-2">Ver</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </details>
      </header>

      {/* Filtros: básicos + avanzados (se mantienen) */}
      <form className="mb-6 rounded-2xl border border-border bg-card p-6">
        {/* Básicos */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Búsqueda</label>
            <input name="q" defaultValue={q} placeholder="email, nombre, empresa, proyecto, título, artista…" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Estado</label>
            <select name="status" defaultValue={status || ""} className="min-w-[12rem] w-full whitespace-nowrap rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Todos</option>
              <option value="NEW">Nuevo</option>
              <option value="IN_REVIEW">En gestión</option>
              <option value="QUOTED">Cotizado</option>
              <option value="CLOSED_WON">Cerrado (Ganado)</option>
              <option value="CLOSED_LOST">Cerrado (Perdido)</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Responsable</label>
            <input name="assignee" defaultValue={assignee} placeholder="Nombre o email…" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Prioridad</label>
            <select name="prio" defaultValue={prio || ""} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Todas</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Orden</label>
            <select name="order" defaultValue={orderParam || (sortByUsed === "followup" ? "asc" : "desc")} className="min-w-[12rem] w-full whitespace-nowrap rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Ordenar por</label>
            <select name="sortBy" defaultValue={sortByUsed} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="created">Creación</option>
              <option value="followup">Follow-up</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Filas</label>
            <select name="take" defaultValue={String(take)} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {[25, 50, 100, 150, 200].map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
        </div>

        {/* Avanzados */}
        <details className="mt-5 group" open={advancedOpen}>
          <summary className="cursor-pointer select-none rounded-md px-1 py-1 text-sm text-muted-foreground hover:text-foreground">
            {advancedOpen ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Desde (fecha)</label>
              <input type="date" name="from" defaultValue={from} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Hasta (fecha)</label>
              <input type="date" name="to" defaultValue={to} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                  <input type="checkbox" name="withFollowUp" value="1" defaultChecked={withFU === "1"} />
                  Con follow-up
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                  <input type="checkbox" name="overdue" value="1" defaultChecked={overdue === "1"} />
                  Sólo atrasados
                </label>
              </div>
              {fuRange && <div className="mt-2 text-xs text-muted-foreground">Quick-filter activo: <strong>{fuRange}</strong> (usa “Quitar” o KPIs para cambiar)</div>}
            </div>
          </div>
        </details>

        {/* Acciones */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">Filtrar</button>
          <Link href="/admin/licensing" className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">Limpiar</Link>
          <a href={`/admin/licensing/export?${currentParams.toString()}&limit=2000`} className="ml-auto rounded-lg border border-border bg-muted px-4 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">Exportar CSV</a>
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
            {rows.map((r) => {
              const fu = r.nextFollowUpAt ? new Date(r.nextFollowUpAt) : null;
              const isOverdue = fu ? fu.getTime() < Date.now() : false;
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/50">
                  <td className="whitespace-nowrap px-4 py-3 align-top">{fmtDate(r.createdAt)}</td>

                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-muted-foreground">{r.email}</div>
                    {r.company && <div className="text-muted-foreground">{r.company}</div>}
                    {r.assignee && <div className="text-muted-foreground">Owner: {r.assignee}</div>}
                    {r.internalNotes && (
                      <div className="text-muted-foreground">
                        📝 {r.internalNotes.length > 80 ? r.internalNotes.slice(0, 80) + "…" : r.internalNotes}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div>{r.projectType}{r.media ? ` · ${r.media}` : ""}</div>
                    <div className="text-muted-foreground">{r.territories || "—"} · {r.term || "—"}</div>
                    <div className="text-muted-foreground">{money(r.budgetAmount, r.budgetCurrency)}</div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{r.trackTitle || "—"}</div>
                    <div className="text-muted-foreground">{r.trackArtist || "—"} · ID: {r.trackId}</div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusBadge v={(r as any).status ?? "NEW"} />
                      <PriorityBadge v={(r as any).priority ?? "MEDIUM"} />
                      {typeof r.mfn === "boolean" && (
                        <span className={`rounded px-2 py-0.5 text-xs ${r.mfn ? "bg-emerald-600 text-white" : "bg-muted"}`}>MFN {r.mfn ? "Sí" : "No"}</span>
                      )}
                      {typeof r.needWhitelist === "boolean" && (
                        <span className={`rounded px-2 py-0.5 text-xs ${r.needWhitelist ? "bg-indigo-600 text-white" : "bg-muted"}`}>Whitelist {r.needWhitelist ? "Sí" : "No"}</span>
                      )}
                      {fu && (
                        <span className={`rounded px-2 py-0.5 text-xs ${isOverdue ? "bg-red-600 text-white" : "bg-card"}`}>
                          Follow-up: {fu.toLocaleString("es-CL")}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap items-center gap-1">
                      <Link
                        prefetch={false}
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
              );
            })}

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
