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

  const fmt = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Licensing — Bandeja</h1>
          <p className="text-sm text-zinc-500">
            Total: {props.totals.total} · Overdue: {props.totals.cOverdue} · Hoy: {props.totals.cToday} · Mañana: {props.totals.cTomorrow} · 7d: {props.totals.cWeek}
          </p>
        </div>
        <div className="text-right">
          {props.errorMsg && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
              {props.errorMsg}
            </div>
          )}
        </div>
      </header>

      {/* Filtros */}
      <section className="rounded-xl border bg-white/50 backdrop-blur p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="col-span-2 rounded-md border px-3 py-2"
          placeholder="Buscar (cliente, email, track...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="rounded-md border px-3 py-2"
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
          className="rounded-md border px-3 py-2"
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

        <div className="flex gap-2">
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2"
            value={fupFrom}
            onChange={(e) => setFupFrom(e.target.value)}
          />
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2"
            value={fupTo}
            onChange={(e) => setFupTo(e.target.value)}
          />
        </div>

        <div className="md:col-span-5 flex justify-end gap-2">
          <button
            className="rounded-md border px-3 py-2"
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
            className="rounded-md bg-black text-white px-3 py-2"
            onClick={() => applyFilters(1)}
          >
            Aplicar
          </button>
        </div>
      </section>

      {/* Lista */}
      <section className="rounded-xl border bg-white/50 backdrop-blur">
        {props.rows.length === 0 ? (
          <div className="p-6 text-sm text-zinc-500">No hay solicitudes para los filtros actuales.</div>
        ) : (
          <ul className="divide-y">
            {props.rows.map((r) => (
              <li key={r.id} className="grid grid-cols-5 gap-3 p-4 hover:bg-white">
                <div className="col-span-2">
                  <div className="font-medium truncate">{r.name ?? "(Sin nombre)"} — {r.company ?? "–"}</div>
                  <div className="text-xs text-zinc-500 truncate">{r.email ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Status</div>
                  <div className="font-medium">{r.status?.replaceAll("_", " ")}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Priority</div>
                  <div className="font-medium">{r.priority ?? "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Follow-up</div>
                  <div className="font-medium">
                    {r.nextFollowUpAt ? fmt.format(new Date(r.nextFollowUpAt)) : "—"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
