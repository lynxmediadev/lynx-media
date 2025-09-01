/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/lib/validators/ids.ts                                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Normaliza y valida identificadores musicales: ISRC, ISWC y UPC.          │
 * │ - Separa "peras y manzanas": normalizar (quitar guiones/espacios, mayús)   │
 * │   vs validar (chequear patrón básico).                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - ISRC: 12 chars → 2 letras país + 3 alfanum regis. + 2 dígitos año +      │
 * │   5 dígitos designación. Regex básica: /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.       │
 * │ - ISWC: "T" + 10 dígitos (quitando separadores). Ej: T-034.524.680-1 →     │
 * │   T0345246801. Regex básica: /^T\d{10}$/.                                   │
 * │ - UPC: 12 dígitos (UPC-A) o 13 dígitos (EAN-13). Aquí solo validamos       │
 * │   longitud + dígitos (el check-digit se puede agregar más adelante).        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

export function normalizeIsrc(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return raw || null;
}
export function isValidIsrc(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(value); // 12 chars totales
}

export function normalizeIswc(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return raw || null;
}
export function isValidIswc(value: string | null | undefined): boolean {
  if (!value) return false;
  // Forma simple: T + 10 dígitos (incluye check digit al final)
  return /^T\d{10}$/.test(value);
}

export function normalizeUpc(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.replace(/\D/g, ""); // solo dígitos
  return raw || null;
}
export function isValidUpc(value: string | null | undefined): boolean {
  if (!value) return false;
  // Aceptamos 12 (UPC-A) o 13 (EAN-13). Más adelante podemos agregar check-digit real.
  return /^\d{12}$/.test(value) || /^\d{13}$/.test(value);
}
