// src/lib/sync.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ sync.ts — Enviar evento de sincronización a Google Sheets (Apps Script)     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Lee LICENSING_SYNC_WEBHOOK (1..N URLs separadas por coma).                │
 * │ - Aplana LicensingRequest (fechas en ISO, arrays legibles).                 │
 * │ - sendLicensingSync(id, reason, source) → busca en BD y POSTea el evento.  │
 * │ - Si no hay webhook configurado: log y no rompe.                            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import prisma from "@/lib/prisma";

type SyncReason =
  | "priority.updated"
  | "followup.updated"
  | "status.updated"
  | "assignee.updated"
  | "notes.updated"
  | "manual.trigger"
  | "created";

function getWebhookUrls(): string[] {
  const raw = process.env.LICENSING_SYNC_WEBHOOK || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function toISO(d?: Date | null) {
  return d ? new Date(d).toISOString() : null;
}

function flatten(row: any) {
  return {
    id: row.id,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
    nextFollowUpAt: toISO(row.nextFollowUpAt),
    status: row.status ?? "NEW",
    priority: row.priority ?? "MEDIUM",
    assignee: row.assignee ?? "",
    name: row.name,
    email: row.email,
    company: row.company ?? "",
    projectType: row.projectType,
    media: row.media ?? "",
    territories: row.territories ?? "",
    term: row.term ?? "",
    budgetAmount: row.budgetAmount ?? null,
    budgetCurrency: row.budgetCurrency ?? null,
    mfn: !!row.mfn,
    needWhitelist: !!row.needWhitelist,
    trackId: row.trackId,
    trackTitle: row.trackTitle ?? "",
    trackArtist: row.trackArtist ?? "",
    trackDurationSec: row.trackDurationSec ?? null,
    moods: row.moods ?? [],
    uses: row.uses ?? [],
    restrictions: row.restrictions ?? [],
    pageUrl: row.pageUrl ?? "",
    notes: row.notes ?? "",
    internalNotes: row.internalNotes ?? "",
  };
}

async function postAll(urls: string[], body: unknown) {
  if (!urls.length) {
    console.log("[sync] No LICENSING_SYNC_WEBHOOK configured; skip.");
    return;
  }
  await Promise.all(urls.map(async (u) => {
    try {
      const r = await fetch(u, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        // Opcional: timeout con AbortController si quieres
      });
      if (!r.ok) console.warn("[sync] webhook non-200:", u, r.status);
    } catch (err) {
      console.warn("[sync] webhook failed:", u, err);
    }
  }));
}

export async function sendLicensingSync(id: string, reason: SyncReason, source: "admin" | "public" = "admin") {
  const row = await prisma.licensingRequest.findUnique({ where: { id } });
  if (!row) {
    console.warn("[sync] row not found:", id);
    return;
  }
  const payload = {
    kind: "licensing.updated",
    reason,
    source,
    ts: new Date().toISOString(),
    data: flatten(row),
  };
  await postAll(getWebhookUrls(), payload);
}
