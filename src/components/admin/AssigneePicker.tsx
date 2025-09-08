"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: AssigneePicker (editar responsable con guardado suave)          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Input de texto con guardado en blur o al hacer clic en "Guardar".         │
 * │ - Botón "Limpiar" deja el campo en NULL.                                    │
 * │ - Toast mínimo para feedback.                                               │
 * │ - Mantiene tokens y estilo sobrio.                                          │
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

export default function AssigneePicker({
  requestId,
  value,
  placeholder = "Nombre o email del responsable…",
}: {
  requestId: string;
  value: string; // puede venir "" si está vacío
  placeholder?: string;
}) {
  const [assignee, setAssignee] = React.useState(value);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const show = (t: string, ms = 1200) => {
    setToast(t);
    setTimeout(() => setToast(null), ms);
  };

  async function save(next: string) {
    setBusy(true);
    try {
      const res = await fetch(`/admin/licensing/${requestId}/assignee`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assignee: next }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      show(next.trim() ? "Responsable actualizado" : "Responsable eliminado");
    } catch {
      show("No se pudo actualizar", 1500);
      // si falla, revertimos el input a su valor previo (opcional)
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wide text-muted-foreground">
        Responsable
      </label>

      <div className="flex gap-2 flex-col">
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          onBlur={() => save(assignee)}
          placeholder={placeholder}
          disabled={busy}
          className="min-w-[16rem] flex-1 rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => save(assignee)}
          className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          Guardar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setAssignee("");
            void save("");
          }}
          className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          Limpiar
        </button>
      </div>

      {toast && <Toast text={toast} />}
    </div>
  );
}
