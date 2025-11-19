// src/app/admin/track/[id]/rights/actions.ts
/**
 * Server action para actualizar "Derechos & explotación" de un track.
 *
 * Ruta:
 *   - /admin/track/[id]/rights
 *   - /admin/track/[id]/edit
 *
 * Peras y manzanas:
 * - Actualiza:
 *     • Licencia, territorios, plazo, media buy, MFN.
 *     • Master (titular del master).
 *     • Content ID (enrolled + admin + whitelist).
 *     • Restricciones de uso (como string[] en Track.restrictions).
 *     • Publishing split (Writer / Publisher) usando solo la tabla
 *       `PublishingShare` (fuente de verdad).
 */

"use server";

import { revalidatePath } from "next/cache";
import { PublishingRole } from "@prisma/client";
import { db } from "@/server/db";
import { rightsFormSchema, type RightsFormValues } from "@/lib/validation/trackSchemas";

type UpdateRightsResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};


/** Normaliza string opcional → string | null (vacío → null) */
function normalizeSimple(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

/** Normaliza int opcional → number | null */
function normalizeNullableInt(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

/** Normaliza checkbox HTML ("on" → true) */
function normalizeCheckbox(raw: FormDataEntryValue | null): boolean {
  return raw === "on";
}

/**
 * Convierte el textarea de restricciones en string[] para Prisma.
 * - Recibe el valor crudo del form.
 * - Lo separa por líneas.
 * - trim().
 * - Filtra líneas vacías.
 */
function normalizeRestrictionsList(
  raw: FormDataEntryValue | null,
): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Server Action principal.
 *
 * Recibe el FormData del formulario de RightsFormClient y:
 * - Actualiza campos de Track.
 * - Reemplaza completamente los PublishingShare (writer/publisher) de ese track.
 */
export async function updateRights(
  formData: FormData,
): Promise<UpdateRightsResult> {
    try {
    // -----------------------------------------------------------------------
    // 1) Validar & normalizar el FormData con Zod
    // -----------------------------------------------------------------------
    const rawObject = Object.fromEntries(formData.entries());

    const parsed = rightsFormSchema.safeParse(rawObject);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return {
        ok: false as const,
        message: "Hay errores de validación en Derechos & explotación.",
        fieldErrors,
      };
    }

    const data: RightsFormValues = parsed.data;

    const trackId = data.id;

    // -----------------------------------------------------------------------
    // 2) Campos de Track (licencia, territorios, master, etc.)
    //    (YA normalizados por Zod)
// -----------------------------------------------------------------------
    const {
      licenseType,
      territories,
      term,
      mediaBuy,
      mfn,
      master,
      contentIdEnrolled,
      contentIdAdmin,
      contentIdWhitelist,
      restrictions,
      writerName,
      writerSharePct,
      writerIpiNumber,
      publisherName,
      publisherSharePct,
      publisherIpiNumber,
    } = data;

    // -----------------------------------------------------------------------
    // 3) Campos de Publishing (Writer / Publisher)
    //    (seguimos usando la misma lógica de creación de PublishingShare)
// -----------------------------------------------------------------------


    // -----------------------------------------------------------------------
    // 4) Preparamos las filas de PublishingShare que vamos a crear
    // -----------------------------------------------------------------------
    const sharesToCreate: {
      role: PublishingRole;
      name: string;
      ipiNumber: string | null;
      sharePct: number | null;
    }[] = [];

    // Writer principal
    if (writerName || writerSharePct !== null || writerIpiNumber) {
      sharesToCreate.push({
        role: PublishingRole.WRITER,
        name: writerName,
        ipiNumber: writerIpiNumber,
        sharePct: writerSharePct,
      });
    }

    // Publisher principal
    if (publisherName || publisherSharePct !== null || publisherIpiNumber) {
      sharesToCreate.push({
        role: PublishingRole.PUBLISHER,
        name: publisherName,
        ipiNumber: publisherIpiNumber,
        sharePct: publisherSharePct,
      });
    }

    // -----------------------------------------------------------------------
    // 5) Transacción:
    //    - Actualizar Track.
    //    - Borrar PublishingShare previos (WRITER/PUBLISHER).
    //    - Crear los nuevos.
    // -----------------------------------------------------------------------
    const tx = [];

    // 5.1) Actualizar Track
    tx.push(
      db.track.update({
        where: { id: trackId },
        data: {
          licenseType,
          territories,
          term,
          mediaBuy,
          mfn,
          master,
          contentIdEnrolled,
          contentIdAdmin,
          contentIdWhitelist,
          restrictions: restrictions, // ✅ AHORA ES string[]
        },
        select: { id: true },
      }),
    );

    // 5.2) Borrar shares existentes de este track (solo WRITER/PUBLISHER)
    tx.push(
      db.publishingShare.deleteMany({
        where: {
          trackId,
          role: { in: [PublishingRole.WRITER, PublishingRole.PUBLISHER] },
        },
      }),
    );

    // 5.3) Crear nuevas filas si corresponde
    if (sharesToCreate.length > 0) {
      tx.push(
        db.publishingShare.createMany({
          data: sharesToCreate.map((s) => ({
            trackId,
            role: s.role,
            name: s.name,
            ipiNumber: s.ipiNumber,
            sharePct: s.sharePct,
          })),
        }),
      );
    }

    await db.$transaction(tx);

    // -----------------------------------------------------------------------
    // 6) Revalidar rutas relacionadas
    // -----------------------------------------------------------------------
    revalidatePath(`/admin/track/${trackId}/edit`);
    revalidatePath(`/admin/track/${trackId}/rights`);
    revalidatePath("/admin/analyze");

    return { ok: true, message: "Derechos actualizados" };
  } catch (err) {
    console.error("[track:rights:updateRights] fatal:", err);
    return {
      ok: false,
      message: "Error al guardar derechos. Revisa logs del servidor.",
    };
  }
}
