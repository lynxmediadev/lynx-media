// src/lib/validation/trackSchemas.ts
/**
 * Esquemas Zod para formularios de Track (admin).
 *
 * Contiene:
 *  - creativeFormSchema  → /admin/track/[id]/edit (CreativeForm)
 *  - idsFormSchema       → /admin/track/[id]/edit (IdsForm)
 *  - rightsFormSchema    → /admin/track/[id]/edit y /admin/track/[id]/rights (RightsFormClient)
 *
 * Peras y manzanas:
 * - Recibimos valores crudos desde FormData (strings, null, undefined).
 * - Normalizamos y validamos tipos (string, boolean, number, string[]).
 * - Devolvemos objetos listos para Prisma (o casi listos).
 */

import { z } from "zod";

// ───────────────────────────────────────────────────────────────────────────────
// Helpers de normalización (reutilizables en los esquemas)
// ───────────────────────────────────────────────────────────────────────────────

/** Normaliza string opcional → string | null (vacío o no-string → null) */
function normalizeText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

/** Normaliza ISRC a MAYÚSCULAS sin espacios ni guiones */
function normalizeIsrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[-\s]/g, "").toUpperCase();
  return cleaned.length ? cleaned : null;
}

/**
 * Convierte textarea (o input con comas/saltos de línea) a string[]:
 * - Separa por saltos de línea y comas.
 * - trim().
 * - Filtra vacíos.
 * - Pasa a MAYÚSCULAS.
 * - Elimina duplicados.
 */
function normalizeList(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => s.toUpperCase()),
    ),
  );
}

/** Normaliza checkbox HTML ("on"/true → true, cualquier otra cosa → false) */
function normalizeCheckbox(raw: unknown): boolean {
  if (raw === true) return true;
  if (typeof raw === "string") {
    const v = raw.toLowerCase();
    if (v === "on" || v === "true" || v === "1") return true;
  }
  return false;
}

/**
 * Normaliza número entero opcional:
 * - "", null, undefined → null
 * - "10" → 10
 * - valores no numéricos → null
 * (el rango 0–100 se valida en el esquema, no aquí)
 */
function normalizeNullableInt(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.trunc(raw) : null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/**
 * Convierte textarea de restricciones en string[]:
 * - Una restricción por línea.
 * - trim().
 * - Filtra vacíos.
 */
function normalizeRestrictions(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ───────────────────────────────────────────────────────────────────────────────
// 1) CreativeForm (título, artista, moods, uses)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Schema base: coincide con los nombres crudos del FormData.
 * Luego .transform() devuelve el shape listo para Prisma.
 */
const creativeFormBaseSchema = z.object({
  // SI QUISIERA EL TÍTULO [NO OBLIGATORIO]
  //  title: z.union([z.string(), z.null(), z.undefined()]),

  title: z
    .string({
      required_error: "El Título es obligatorio.",
      invalid_type_error: "El Título debe ser texto.",
    })
    .min(1, "El Título es obligatorio."),
  artist: z
    .string({
      required_error: "El Artista / proyecto es obligatorio.",
      invalid_type_error: "El Artista / proyecto debe ser texto.",
    })
    .min(1, "El Artista / proyecto es obligatorio."),
  moods: z.union([z.string(), z.null(), z.undefined()]),
  uses: z.union([z.string(), z.null(), z.undefined()]),
});

export const creativeFormSchema = creativeFormBaseSchema.transform((values) => {
  return {
    title: values.title.trim(),
    artist: values.artist.trim(),
    moods: normalizeList(values.moods),
    uses: normalizeList(values.uses),
  };
});
// Aquí SOLO haces validaciones extra de moods/uses
// El superRefine puede quedar vacío, sólo basta con comentar los campos que no quiero como obligatorios.
// .superRefine((values, ctx) => {

// if (!values.moods || values.moods.length === 0) {
//   ctx.addIssue({
//     code: z.ZodIssueCode.custom,
//     message: "Debes ingresar al menos un mood.",
//     path: ["moods"],
//   });
// }

// if (!values.uses || values.uses.length === 0) {
//   ctx.addIssue({
//     code: z.ZodIssueCode.custom,
//     message: "Debes ingresar al menos un uso recomendado.",
//     path: ["uses"],
//   });
// }
// });

export type CreativeFormValues = z.infer<typeof creativeFormSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// 2) IdsForm (ISRC, ISWC, UPC)
// ───────────────────────────────────────────────────────────────────────────────

const idsFormBaseSchema = z.object({
  // TÍTULO YA NO OBLIGATORIO
  // title: z.union([z.string(), z.null(), z.undefined()]),

  isrc: z
    .string()
    .trim()
    .min(1, "El ISRC es obligatorio.")
    .regex(/^[A-Z0-9]+$/, "El ISRC solo puede contener letras y números."),
  iswc: z
    .string()
    .trim()
    .min(1, "El ISWC es obligatorio.")
    .regex(/^[A-Z0-9]+$/, "El ISWC solo puede contener letras y números."),

  upc: z.union([z.string(), z.null(), z.undefined()]),
});

export const idsFormSchema = idsFormBaseSchema.transform((values) => {
  return {
    isrc: normalizeIsrc(values.isrc),
    iswc: normalizeText(values.iswc),
    upc: normalizeText(values.upc),
  };
});

export type IdsFormValues = z.infer<typeof idsFormSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// 3) RightsFormClient (licencias, Content ID, restricciones, publishing)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Schema base para RightsFormClient: coincide 1:1 con los nombres de los
 * <input>/<textarea> del formulario.
 *
 * Importante:
 * - `id` viene de un `<input type="hidden" name="id" />`.
 * - Los checkboxes vienen como "on" o no vienen.
 * - Las shares vienen como strings ("50", "25", etc.).
 */
const rightsFormBaseSchema = z.object({
  id: z.union([z.string(), z.number()]),

  // Track: licencia & alcance
  licenseType: z.union([z.string(), z.null(), z.undefined()]),
  territories: z.union([z.string(), z.null(), z.undefined()]),
  term: z.union([z.string(), z.null(), z.undefined()]),
  mediaBuy: z.union([z.string(), z.null(), z.undefined()]),
  mfn: z.union([z.string(), z.boolean(), z.null(), z.undefined()]),
  master: z.union([z.string(), z.null(), z.undefined()]),

  // Track: Content ID & administración
  contentIdEnrolled: z.union([
    z.string(),
    z.boolean(),
    z.null(),
    z.undefined(),
  ]),
  contentIdAdmin: z.union([z.string(), z.null(), z.undefined()]),
  contentIdWhitelist: z.union([z.string(), z.null(), z.undefined()]),
  restrictions: z.union([z.string(), z.null(), z.undefined()]),

  // Publishing: Writer
  writerName: z.union([z.string(), z.null(), z.undefined()]),
  writerSharePct: z.union([z.string(), z.number(), z.null(), z.undefined()]),
  writerIpiNumber: z.union([z.string(), z.null(), z.undefined()]),

  // Publishing: Publisher
  publisherName: z.union([z.string(), z.null(), z.undefined()]),
  publisherSharePct: z.union([z.string(), z.number(), z.null(), z.undefined()]),
  publisherIpiNumber: z.union([z.string(), z.null(), z.undefined()]),
});

/**
 * Schema transformado:
 * - Normaliza strings (trim, vacío → null/"" según corresponda).
 * - Convierte checkboxes a boolean.
 * - Convierte restricciones a string[].
 * - Convierte shares a number | null y valida rango 0–100.
 *
 * NOTA: No obligamos a que los shares sumen 100, solo que estén en rango.
 */
export const rightsFormSchema = rightsFormBaseSchema.transform((values) => {
  const writerShare = normalizeNullableInt(values.writerSharePct);
  const publisherShare = normalizeNullableInt(values.publisherSharePct);

  // Validación suave de rango (0–100). Si se sale de rango, lo dejamos como null.
  const safeWriterShare =
    writerShare == null || (writerShare >= 0 && writerShare <= 100)
      ? writerShare
      : null;

  const safePublisherShare =
    publisherShare == null || (publisherShare >= 0 && publisherShare <= 100)
      ? publisherShare
      : null;

  return {
    id: String(values.id),

    licenseType: normalizeText(values.licenseType),
    territories: normalizeText(values.territories),
    term: normalizeText(values.term),
    mediaBuy: normalizeText(values.mediaBuy),
    mfn: normalizeCheckbox(values.mfn),
    master: normalizeText(values.master),

    contentIdEnrolled: normalizeCheckbox(values.contentIdEnrolled),
    contentIdAdmin: normalizeText(values.contentIdAdmin),
    contentIdWhitelist: normalizeText(values.contentIdWhitelist),
    restrictions: normalizeRestrictions(values.restrictions),

    writerName: normalizeText(values.writerName) ?? "",
    writerSharePct: safeWriterShare,
    writerIpiNumber: normalizeText(values.writerIpiNumber),

    publisherName: normalizeText(values.publisherName) ?? "",
    publisherSharePct: safePublisherShare,
    publisherIpiNumber: normalizeText(values.publisherIpiNumber),
  };
});

export type RightsFormValues = z.infer<typeof rightsFormSchema>;
