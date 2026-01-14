"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ _client.tsx (UI interactiva)                                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Pintar la lista con filtros.                                              │
 * │ - Opciones de STATUS/PRIORITY vienen del server desde enums de Prisma.     │
 * │ - Formatear fechas en el cliente para evitar hydration mismatch.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Row = {
  id: string;
  createdAt: number | null;      // ← timestamps (ms) enviados por el server
  updatedAt: number | null;
  nextFollowUpAt: number | null;
  assignee: string | null;
  name: string | null;
  email: string | null;
  company: string | null;
  projectType: string | null;
  media: string | null;
  territories: string[] | null;
  term: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  mfn: boolean | null;
  needWhitelist: boolean | null;
  notes: string | null;
  trackId: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  trackDurationSec: number | null;
  moods: string[] | null;
  uses: string[] | null;
  restrictions: string[] | null;
  pageUrl: string | null;
  status: string;
  internalNotes: string | null;
  priority: string | null;
};

export default function LicensingAdminClient(props: {
  rows: Row[];
  totals: { total: number; cOverdue: number; cToday: number; cTomorrow: number; cWeek: number };
  errorMsg: string | null;
  statusOptions: string[];     // ← del enum real Prisma.RequestStatus
  priorityOptions: string[];   // ← del enum real Prisma.RequestPriority
  initialQS: {
    q: string;
    status: string;
    priority: string;
    fupFrom: string;
    fupTo: string;
    page: number;
    per: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Estado controlado del formulario (inicializado con initialQS)
  const [q, setQ] = React.useState(props.initialQS.q ?? "");
  const [status, setStatus] = React.useState(props.initialQS.status ?? "");
  const [priority, setPriority] = React.useState(props.initialQS.priority ?? "");
  const [fupFrom, setFupFrom] = React.useState(props.initialQS.fupFrom ?? "");
  const [fupTo, setFupTo] = React.useState(props.initialQS.fupTo ?? "");

  function applyFilters(nextPage = 1) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    // Actualizamos parámetros
    q ? params.set("q", q) : params.delete("q");
    status ? params.set("status", status) : params.delete("status");
    priority ? params.set("priority", priority) : params.delete("priority");
    fupFrom ? params.set("fupFrom", fupFrom) : params.delete("fupFrom");
    fupTo ? params.set("fupTo", fupTo) : params.delete("fupTo");
    params.set("page", String(nextPage));
    params.set("per", String(props.initialQS.per || 20));
    router.push(`${pathname}?${params.toString()}`);
  }

  const fmt = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">
            Licencias — Bandeja
          </h1>
          <p className="text-sm text-zinc-400">
            Total: {props.totals.total} · Overdue: {props.totals.cOverdue} · Hoy:{" "}
            {props.totals.cToday} · Mañana: {props.totals.cTomorrow} · 7d:{" "}
            {props.totals.cWeek}
          </p>
        </div>
        <div className="text-right">
          {props.errorMsg && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {props.errorMsg}
            </div>
          )}
        </div>
      </header>

      {/* Filtros */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 backdrop-blur">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            className="col-span-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
            placeholder="Buscar (cliente, email, track...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Status (todos)</option>
            {props.statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Priority (todas)</option>
            {props.priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-1 items-center gap-3 md:grid-cols-5">
          <div className="flex gap-2 md:col-span-2">
            <input
              type="date"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
              value={fupFrom}
              onChange={(e) => setFupFrom(e.target.value)}
            />
            <input
              type="date"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
              value={fupTo}
              onChange={(e) => setFupTo(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 md:col-span-3">
            <button
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              onClick={() => {
                setQ(""); setStatus(""); setPriority(""); setFupFrom(""); setFupTo("");
                const params = new URLSearchParams();
                params.set("page", "1");
                params.set("per", String(props.initialQS.per || 20));
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              Limpiar
            </button>
            <button
              className="rounded-md border border-zinc-700 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
              onClick={() => applyFilters(1)}
            >
              Aplicar
            </button>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 backdrop-blur">
        {props.rows.length === 0 ? (
          <div className="p-6 text-sm text-zinc-500">
            No hay solicitudes para los filtros actuales.
          </div>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead className="bg-zinc-900/80 text-xs tracking-wide text-zinc-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left align-middle">Cliente</th>
                <th className="px-4 py-3 text-left align-middle">Status</th>
                <th className="px-4 py-3 text-left align-middle">Prioridad</th>
                <th className="px-4 py-3 text-left align-middle">Track</th>
                <th className="px-4 py-3 text-right align-middle">Follow-up</th>
                <th className="px-4 py-3 text-right align-middle">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-zinc-800/80 hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-50">
                        {r.name ?? "(Sin nombre)"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {r.company ?? "—"}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {r.email ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-xs text-zinc-500">Status</div>
                    <div className="font-medium text-zinc-100">
                      {r.status?.replaceAll("_", " ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-xs text-zinc-500">Prioridad</div>
                    <div className="font-medium text-zinc-100">
                      {r.priority ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-xs text-zinc-500">Track</div>
                    <div className="font-medium text-zinc-100">
                      {r.trackTitle ?? "—"}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {r.trackArtist ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="text-xs text-zinc-500">Follow-up</div>
                    <div className="font-medium text-zinc-100">
                      {r.nextFollowUpAt
                        ? fmt.format(new Date(r.nextFollowUpAt))
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <Link
                      href={`/admin/licensing/${r.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
