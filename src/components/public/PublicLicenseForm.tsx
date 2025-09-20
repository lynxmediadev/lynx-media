// src/components/public/PublicLicenseForm.tsx
"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ PublicLicenseForm — Envío robusto con reset seguro y estado consistente     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Capturamos una referencia estable al <form> (useRef) antes del await.     │
 * │ - Usamos try/catch/finally: pase lo que pase, busy vuelve a false.          │
 * │ - El mensaje (verde/rojo) depende 100% del resultado real del servidor.     │
 * │ - Tras éxito, hacemos form.reset() usando la ref (no e.currentTarget).      │
 * │ - startedAt se renueva para el anti-bot de “tiempo mínimo”.                 │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";

type Props = {
  track: { id: string; title: string; artist: string; durationSec?: number | null };
  csrfToken: string;
  startedAt: number; // semilla inicial (servidor)
};

export default function PublicLicenseForm({ track, csrfToken, startedAt }: Props) {
  // Ref estable del formulario para poder resetearlo después de await
  const formRef = React.useRef<HTMLFormElement | null>(null);

  // Estado de anti-bot “tiempo mínimo”: se renueva tras cada envío OK
  const [startedAtState, setStartedAtState] = React.useState<number>(startedAt);

  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<boolean | null>(null); // null = no mostrar alerta

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Capturamos referencia estable ANTES del await
    const formEl = formRef.current ?? e.currentTarget;

    setBusy(true);
    setMsg(null);
    setOk(null);

    // Construimos el payload desde la referencia, no desde el evento
    const fd = new FormData(formEl);
    const payload = {
      // anti-bot / csrf
      website: String(fd.get("website") || ""),
      startedAt: Number(fd.get("startedAt") || 0),
      csrf: String(fd.get("csrf") || ""),

      // contacto
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      company: String(fd.get("company") || "").trim(),

      // proyecto
      projectType: String(fd.get("projectType") || "").trim(),
      media: String(fd.get("media") || "").trim(),
      territories: String(fd.get("territories") || "").trim(),
      term: String(fd.get("term") || "").trim(),
      budgetAmount: Number(fd.get("budgetAmount") || 0) || null,
      budgetCurrency: String(fd.get("budgetCurrency") || "").trim() || null,
      mfn: fd.get("mfn") === "on",
      needWhitelist: fd.get("needWhitelist") === "on",

      // uso
      uses: (fd.getAll("uses") as string[]).map((s) => String(s)),
      // En el server lo transformamos a string[]; aquí va como textarea string
      restrictions: String(fd.get("restrictions") || "").trim(),
      notes: String(fd.get("notes") || "").trim(),

      // track
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist,
      trackDurationSec: track.durationSec ?? null,
    };

    // Variables locales para consolidar el resultado y mostrar un único mensaje
    let okResp = false;
    let message = "No se pudo enviar la solicitud. Intenta nuevamente.";

    try {
      const r = await fetch("/api/licensing/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      let j: any = {};
      try { j = await r.json(); } catch {}

      okResp = Boolean(r.ok && j?.ok === true);
      message = okResp
        ? "¡Solicitud enviada! Te contactaremos pronto."
        : (j?.error ? String(j.error) : `No se pudo enviar (HTTP ${r.status})`);

      // Actualizamos UI con el resultado real
      setOk(okResp);
      setMsg(message);
    } catch {
      okResp = false;
      setOk(false);
      setMsg("No se pudo enviar la solicitud (red). Intenta nuevamente.");
    } finally {
      // Si fue OK: limpiamos el formulario desde la REF (nunca null)
      if (okResp && formEl) {
        try { formEl.reset(); } catch {}
        setStartedAtState(Date.now()); // renovar anti-bot
      }
      setBusy(false); // pase lo que pase, salimos del estado “Enviando…”
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      {/* Metadatos anti-spam / CSRF */}
      <input type="hidden" name="startedAt" value={String(startedAtState)} />
      <input type="hidden" name="csrf" value={csrfToken} />
      {/* Honeypot oculto (no toca tu globals.css) */}
      <div style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <label>Website (no completar)</label>
        <input name="website" type="text" autoComplete="off" />
      </div>

      {/* Track (read-only) */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm text-muted-foreground">Estás solicitando licencia para:</div>
        <div className="mt-1 text-lg font-semibold">{track.title}</div>
        <div className="text-muted-foreground">{track.artist}</div>
      </div>

      {/* Contacto */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Nombre*</label>
          <input name="name" required className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Email*</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Empresa</label>
          <input name="company" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </div>

      {/* Proyecto */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Tipo de proyecto*</label>
          <select name="projectType" required className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Selecciona…</option>
            <option>Publicidad</option>
            <option>Serie/TV</option>
            <option>Película</option>
            <option>Online</option>
            <option>Interno</option>
            <option>Otro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Medio</label>
          <input name="media" placeholder="TV, Online, DOOH…" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Territorios</label>
          <input name="territories" placeholder="CL, LATAM, Global…" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Plazo</label>
          <input name="term" placeholder="12 meses, perpetuo…" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Presupuesto</label>
          <div className="flex gap-2">
            <input name="budgetAmount" type="number" min="0" step="1" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <select name="budgetCurrency" className="w-28 rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">—</option>
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="mfn" /> MFN
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="needWhitelist" /> Whitelist
          </label>
        </div>
      </div>

      {/* Uso */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Usos (elige los que apliquen)</label>
          <div className="flex flex-wrap gap-3 text-sm">
            {["Background", "Main Theme", "Trailer", "Paid Ads", "Organic"].map((u) => (
              <label key={u} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                <input type="checkbox" name="uses" value={u} /> {u}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Restricciones</label>
          <textarea name="restrictions" rows={3} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs uppercase text-muted-foreground">Notas adicionales</label>
          <textarea name="notes" rows={3} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </div>

      {/* Enviar + Mensaje */}
      <div className="flex items-center gap-3">
        <button
          disabled={busy}
          className="rounded-lg border border-border bg-muted px-5 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {busy ? "Enviando…" : "Solicitar licencia"}
        </button>
        {msg && (
          <div className={`text-sm ${ok ? "text-emerald-600" : "text-red-600"}`}>
            {msg}
          </div>
        )}
      </div>
    </form>
  );
}
