// src/lib/dates.ts
/**
 * dates.ts — Helpers de fecha/hora
 * - parseDateBoundary("2025-09-17", inclusiveEnd=true) → Date al final del día.
 */
export function parseDateBoundary(input?: string | null, inclusiveEnd = false) {
  const s = (input ?? "").trim();
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.valueOf())) return undefined;
  if (inclusiveEnd) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}
