// src/lib/antibot.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ anti-bot.ts — Barreras simples anti-spam (sin dependencias)                 │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Honeypot: campo oculto `website` debe llegar vacío.                       │
 * │ - Tiempo mínimo de llenado: startedAt (ms) → ahora debe ser ≥ minMs.        │
 * │ - Rate-limit suave por cookie: 1 envío/30s por navegador.                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

export function isHoneypotTripped(website?: string | null) {
  return Boolean(website && String(website).trim().length > 0);
}

export function isTooFast(startedAtMs?: number | null, minMs = 5000) {
  if (!startedAtMs || !Number.isFinite(startedAtMs)) return true; // si no viene, lo consideramos sospechoso
  const delta = Date.now() - Number(startedAtMs);
  return delta < minMs;
}

/** Lee IP aproximada desde headers (best-effort, por logging/huella). */
export function getClientIp(headers: Headers) {
  const direct = headers.get("x-real-ip");
  const fwd = headers.get("x-forwarded-for");
  const forwarded = fwd ? fwd.split(",")[0]?.trim() : "";
  return (direct ?? forwarded ?? "").slice(0, 100);
}
