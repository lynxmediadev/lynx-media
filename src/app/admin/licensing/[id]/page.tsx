// src/app/admin/licensing/[id]/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Detalle de Solicitud — Fix “Volver”                                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Problema: al volver al listado, se veía un snapshot viejo.                │
 * │ - Solución: usar <a href="/admin/licensing"> (navegación dura) en “Volver”  │
 * │   para forzar un render fresco del listado.                                 │
 * │ - Mantenemos todo lo demás igual (gestión, notas, prioridad, follow-up, etc)│
 * │ - Next 15: `params` es Promise → `await params`.                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import prisma from "@/lib/prisma";
// ⬅ Nota: quitamos `Link` porque ahora usamos <a> en “Volver”
import QuickAdminActions from "@/components/admin/QuickAdminActions";
import StatusPicker from "@/components/admin/StatusPicker";
import AssigneePicker from "@/components/admin/AssigneePicker";
import InternalNotesEditor from "@/components/admin/InternalNotesEditor";
import ReplyTemplates from "@/components/admin/ReplyTemplates";
import PriorityPicker from "@/components/admin/PriorityPicker";
import FollowUpPicker from "@/components/admin/FollowUpPicker";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(d);
}
function fmtDuration(sec?: number | null) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
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
function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-border bg-card rounded-xl border p-4 shadow-sm ${className}`}>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
function KV({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 items-baseline gap-3 py-1 sm:grid-cols-4">
      <div className="text-muted-foreground col-span-1 text-xs tracking-wide uppercase sm:text-[0.8rem]">{label}</div>
      <div className={`bg-muted col-span-2 rounded-md px-2 py-1 text-sm leading-6 sm:col-span-3 ${mono ? "font-mono" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = await prisma.licensingRequest.findUnique({ where: { id } });
  if (!row) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-4">
          {/* ⬇ Volver con <a> para navegación dura */}
          <a href="/admin/licensing" className="text-sm underline underline-offset-2">← Volver al listado</a>
        </div>
        <div className="border-border bg-card rounded-lg border p-4">No se encontró la solicitud indicada.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-3">
        {/* ⬇ Volver con <a> para navegación dura */}
        <a href="/admin/licensing" className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2">← Volver</a>
      </div>

      {/* Header con estado, responsable y flags */}
      <header className="border-border bg-card mb-6 rounded-2xl border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl leading-tight font-semibold">Solicitud de Licencia</h1>
          <code className="bg-muted rounded px-2 py-0.5 text-xs">{row.id}</code>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <StatusBadge v={row.status as unknown as string} />
            {row.assignee && <span className="bg-muted inline-block rounded px-2 py-0.5 text-xs font-medium">Owner: {row.assignee}</span>}
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${row.mfn ? "bg-emerald-600 text-white" : "bg-muted"}`}>MFN {row.mfn ? "Sí" : "No"}</span>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${row.needWhitelist ? "bg-indigo-600 text-white" : "bg-muted"}`}>Whitelist {row.needWhitelist ? "Sí" : "No"}</span>
          </div>
        </div>

        {/* Resumen clave */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="border-border bg-muted rounded-lg border px-3 py-2 text-sm"><div className="text-muted-foreground text-[0.8rem]">Fecha</div><div className="font-medium">{fmtDate(row.createdAt)}</div></div>
          <div className="border-border bg-muted rounded-lg border px-3 py-2 text-sm"><div className="text-muted-foreground text-[0.8rem]">Presupuesto</div><div className="font-medium">{row.budgetAmount ? new Intl.NumberFormat("es-CL",{style:"currency",currency:row.budgetCurrency ?? "CLP",maximumFractionDigits: row.budgetCurrency==="CLP"?0:2}).format(row.budgetAmount) : "—"}</div></div>
          <div className="border-border bg-muted rounded-lg border px-3 py-2 text-sm"><div className="text-muted-foreground text-[0.8rem]">Term</div><div className="font-medium">{row.term || "—"}</div></div>
          <div className="border-border bg-muted rounded-lg border px-3 py-2 text-sm"><div className="text-muted-foreground text-[0.8rem]">Territorios</div><div className="font-medium">{row.territories || "—"}</div></div>
          <div className="border-border bg-muted rounded-lg border px-3 py-2 text-sm"><div className="text-muted-foreground text-[0.8rem]">Medio</div><div className="font-medium">{row.media || "—"}</div></div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Izquierda */}
        <div className="space-y-6">
          <SectionCard title="Solicitante">
            <KV label="Nombre" value={row.name} />
            <KV label="Email" value={<a href={`mailto:${row.email}`} className="underline decoration-dotted underline-offset-2 hover:opacity-90">{row.email}</a>} mono />
            <KV label="Empresa" value={row.company || "—"} />
          </SectionCard>

          <SectionCard title="Proyecto">
            <KV label="Tipo de proyecto" value={row.projectType} />
            <KV label="Medio" value={row.media || "—"} />
            <KV label="Territorios" value={row.territories || "—"} />
            <KV label="Term" value={row.term || "—"} />
            <KV label="Presupuesto" value={row.budgetAmount ? <>
              {new Intl.NumberFormat("es-CL",{style:"currency",currency:row.budgetCurrency ?? "CLP",maximumFractionDigits: row.budgetCurrency==="CLP"?0:2}).format(row.budgetAmount)}{" "}
              <span className="text-muted-foreground">({row.budgetCurrency ?? "CLP"})</span>
            </> : "—"} mono />
            <KV label="MFN" value={row.mfn ? "Sí" : "No"} />
            <KV label="Content ID Whitelist" value={row.needWhitelist ? "Sí" : "No"} />
          </SectionCard>

          {/* Detalle (lectura) */}
          <SectionCard title="Detalle">
            <KV label="Prioridad" value={String(row.priority ?? "MEDIUM")} />
            <KV label="Próximo follow-up" value={row.nextFollowUpAt ? new Date(row.nextFollowUpAt).toLocaleString("es-CL") : "—"} />
          </SectionCard>

          <SectionCard title="Notas del solicitante">
            <pre className="bg-muted rounded-lg p-3 text-[0.95rem] leading-7 whitespace-pre-wrap">{row.notes || "—"}</pre>
          </SectionCard>
        </div>

        {/* Derecha */}
        <div className="space-y-6">
          <SectionCard title="Gestión (interno)">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatusPicker requestId={row.id} value={row.status as unknown as string} />
                <AssigneePicker requestId={row.id} value={(row.assignee ?? "") as string} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <PriorityPicker requestId={row.id} value={(row.priority as any) ?? "MEDIUM"} />
                <FollowUpPicker requestId={row.id} valueISO={row.nextFollowUpAt ? row.nextFollowUpAt.toISOString() : null} />
              </div>
              <InternalNotesEditor requestId={row.id} initialValue={(row.internalNotes ?? "") as string} />
            </div>
          </SectionCard>

          <SectionCard title="Track">
            <KV label="ID" value={row.trackId} mono />
            <KV label="Título" value={row.trackTitle || "—"} />
            <KV label="Artista" value={row.trackArtist || "—"} />
            <KV label="Duración" value={<>{row.trackDurationSec ?? "—"} <span className="text-muted-foreground">({fmtDuration(row.trackDurationSec)})</span></>} mono />
            <KV label="Moods" value={(row.moods || []).length ? row.moods.join(", ") : "—"} />
            <KV label="Usos" value={(row.uses || []).length ? row.uses.join(", ") : "—"} />
            <KV label="Restricciones" value={(row.restrictions || []).length ? row.restrictions.join(", ") : "—"} />
            <KV label="URL de la página" value={row.pageUrl ? <a href={row.pageUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:opacity-90">{row.pageUrl}</a> : "—"} />
          </SectionCard>

          <SectionCard title="Acciones rápidas">
            <QuickAdminActions request={{
              id: row.id, createdAtISO: row.createdAt.toISOString(),
              name: row.name, email: row.email, company: row.company ?? "",
              projectType: row.projectType, media: row.media ?? "", territories: row.territories ?? "", term: row.term ?? "",
              budgetAmount: row.budgetAmount ?? null, budgetCurrency: row.budgetCurrency ?? null,
              mfn: row.mfn, needWhitelist: row.needWhitelist, notes: row.notes ?? "",
              trackId: row.trackId, trackTitle: row.trackTitle ?? "", trackArtist: row.trackArtist ?? "",
              trackDurationSec: row.trackDurationSec ?? null, moods: row.moods ?? [], uses: row.uses ?? [], restrictions: row.restrictions ?? [],
              pageUrl: row.pageUrl ?? "", rawPayload: row.rawPayload ?? {},
            }} />
          </SectionCard>

          <SectionCard title="Respuestas rápidas (email)">
            <ReplyTemplates
              toEmail={row.email}
              request={{
                name: row.name,
                email: row.email,
                company: row.company ?? "",
                projectType: row.projectType,
                media: row.media ?? "",
                territories: row.territories ?? "",
                term: row.term ?? "",
                budgetAmount: row.budgetAmount ?? null,
                budgetCurrency: row.budgetCurrency ?? null,
                trackTitle: row.trackTitle ?? "",
                trackArtist: row.trackArtist ?? "",
              }}
            />
          </SectionCard>

          <SectionCard title="Payload bruto (JSON)">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium select-none hover:opacity-90">Mostrar / ocultar</summary>
              <pre className="bg-muted mt-3 max-h-[60vh] overflow-auto rounded-lg p-3 text-xs leading-6">{JSON.stringify(row.rawPayload, null, 2)}</pre>
            </details>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
