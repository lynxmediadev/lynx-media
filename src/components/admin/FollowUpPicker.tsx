"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: FollowUpPicker (fecha/hora con guardar y limpiar)               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Inputs nativos de fecha y hora.                                           │
 * │ - Convierte a ISO (UTC) para el backend.                                    │
 * │ - Botones Guardar / Limpiar + toast.                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";

function toLocalParts(iso?: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}

// Une fecha (YYYY-MM-DD) + hora (HH:mm) locales → ISO (UTC)
function toISO(date: string, time: string) {
  if (!date && !time) return null;
  // Si no hay hora, asumimos 09:00 local (sano por defecto)
  const t = time || "09:00";
  const dtLocal = new Date(`${date}T${t}`);
  if (Number.isNaN(dtLocal.getTime())) return null;
  return dtLocal.toISOString();
}

function Toast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-sm shadow">
      {text}
    </div>
  );
}

export default function FollowUpPicker({
  requestId,
  valueISO,
}: {
  requestId: string;
  valueISO: string | null; // ISO o null
}) {
  const init = toLocalParts(valueISO || undefined);
  const [date, setDate] = React.useState(init.date);
  const [time, setTime] = React.useState(init.time);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const show = (t: string, ms = 1200) => {
    setToast(t);
    setTimeout(() => setToast(null), ms);
  };

  async function save() {
    setBusy(true);
    try {
      const iso = toISO(date, time);
      const res = await fetch(`/admin/licensing/${requestId}/follow-up`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nextFollowUpAt: iso }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      show(iso ? "Follow-up actualizado" : "Follow-up eliminado");
    } catch {
      show("No se pudo actualizar", 1500);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setDate("");
    setTime("");
    void save(); // guardará null
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wide text-muted-foreground">Próximo follow-up</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          Guardar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={clearAll}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          Limpiar
        </button>
      </div>
      {valueISO && (
        <div className="text-xs text-muted-foreground">
          Actual: {new Date(valueISO).toLocaleString("es-CL")}
        </div>
      )}
      {toast && <Toast text={toast} />}
    </div>
  );
}
