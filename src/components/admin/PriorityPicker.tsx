"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: PriorityPicker                                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Select LOW/MEDIUM/HIGH con POST y toast mínimo.                           │
 * │ - Mantiene estilo sobrio; sin dependencias externas.                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";

function Toast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-sm shadow">
      {text}
    </div>
  );
}

export default function PriorityPicker({
  requestId,
  value,
}: {
  requestId: string;
  value: "LOW" | "MEDIUM" | "HIGH";
}) {
  const [current, setCurrent] = React.useState(value);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const show = (t: string, ms = 1200) => {
    setToast(t);
    setTimeout(() => setToast(null), ms);
  };

  async function save(next: "LOW" | "MEDIUM" | "HIGH") {
    setBusy(true);
    try {
      const res = await fetch(`/admin/licensing/${requestId}/priority`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priority: next }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setCurrent(next);
      show("Prioridad actualizada");
    } catch {
      show("No se pudo actualizar", 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wide text-muted-foreground">Prioridad</label>
      <select
        value={current}
        disabled={busy}
        onChange={(e) => void save(e.target.value as any)}
        className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="LOW">Baja</option>
        <option value="MEDIUM">Media</option>
        <option value="HIGH">Alta</option>
      </select>
      {toast && <Toast text={toast} />}
    </div>
  );
}
