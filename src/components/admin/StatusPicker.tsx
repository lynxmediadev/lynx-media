"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: StatusPicker (selector + guardado inmediato)                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Muestra un <select> con 5 estados.                                        │
 * │ - Al cambiar, hace POST a /admin/licensing/[id]/status.                     │
 * │ - Feedback visual mínimo (toast).                                           │
 * │ - Respeta tus tokens de color/estética.                                     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";

const OPTIONS = [
  { v: "NEW", label: "Nuevo" },
  { v: "IN_REVIEW", label: "En gestión" },
  { v: "QUOTED", label: "Cotizado" },
  { v: "CLOSED_WON", label: "Cerrado (Ganado)" },
  { v: "CLOSED_LOST", label: "Cerrado (Perdido)" },
];

function Toast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-sm shadow">
      {text}
    </div>
  );
}

export default function StatusPicker({
  requestId,
  value,
}: {
  requestId: string;
  value: string; // "NEW" | ...
}) {
  const [status, setStatus] = React.useState(value);
  const [toast, setToast] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function save(next: string) {
    setBusy(true);
    try {
      const res = await fetch(`/admin/licensing/${requestId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setStatus(next);
      setToast("Estado actualizado");
      setTimeout(() => setToast(null), 1200);
    } catch {
      setToast("No se pudo actualizar");
      setTimeout(() => setToast(null), 1400);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wide text-muted-foreground">
        Estado
      </label>
      <select
        value={status}
        onChange={(e) => save(e.target.value)}
        disabled={busy}
        className="min-w-[14rem] w-full whitespace-nowrap rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {OPTIONS.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
      {toast && <Toast text={toast} />}
    </div>
  );
}
