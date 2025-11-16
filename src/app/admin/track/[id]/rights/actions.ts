// src/app/admin/track/[id]/rights/actions.ts
/**
 * Server action para actualizar "Derechos & explotación" de un track.
 *
 * Se usa tanto en:
 *   - /admin/track/[id]/rights
 *   - /admin/track/[id]/edit
 *
 * Peras y manzanas:
 * - Actualiza licencia, territorios, plazo, media buy, MFN, Content ID, master,
 *   restricciones y el Publishing split (writer/publisher) empaquetado en
 *   Track.publishingSplit como JSON.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";

export async function updateRights(formData: FormData) {
  try {
    const id = (formData.get("id") as string | null)?.trim();
    if (!id) {
      return { ok: false, message: "ID de track inválido" };
    }

    // -------- Campos básicos de licencia / alcance --------
    const licenseType =
      (formData.get("licenseType") as string | null)?.trim() || null;
    const territories =
      (formData.get("territories") as string | null)?.trim() || null;
    const term = (formData.get("term") as string | null)?.trim() || null;
    const mediaBuy =
      (formData.get("mediaBuy") as string | null)?.trim() || null;

    // -------- Master --------
    const master = (formData.get("master") as string | null)?.trim() || null;

    // -------- MFN / Content ID (booleanos) --------
    const mfn = formData.get("mfn") === "on";
    const contentIdEnrolled = formData.get("contentIdEnrolled") === "on";

    // -------- Admin / whitelist Content ID --------
    const contentIdAdmin =
      (formData.get("contentIdAdmin") as string | null)?.trim() || null;
    const contentIdWhitelist =
      (formData.get("contentIdWhitelist") as string | null)?.trim() || null;

    // -------- Restricciones (array de strings) --------
    const restrictionsRaw =
      (formData.get("restrictions") as string | null) ?? "";
    const restrictions = restrictionsRaw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    // -------- Publishing split (writer / publisher) --------
    const writerName =
      (formData.get("writerName") as string | null)?.trim() ?? "";
    const publisherName =
      (formData.get("publisherName") as string | null)?.trim() ?? "";

    const writerShareRaw =
      (formData.get("writerSharePct") as string | null)?.trim() ?? "";
    const publisherShareRaw =
      (formData.get("publisherSharePct") as string | null)?.trim() ?? "";

    const writerSharePct = writerShareRaw
      ? Number.parseInt(writerShareRaw, 10)
      : null;
    const publisherSharePct = publisherShareRaw
      ? Number.parseInt(publisherShareRaw, 10)
      : null;

    type SplitSide = { name: string; sharePct: number | null };

    const publishingSplitObj: {
      writer?: SplitSide;
      publisher?: SplitSide;
    } = {};

    if (writerName || writerSharePct !== null) {
      publishingSplitObj.writer = {
        name: writerName,
        sharePct: writerSharePct,
      };
    }

    if (publisherName || publisherSharePct !== null) {
      publishingSplitObj.publisher = {
        name: publisherName,
        sharePct: publisherSharePct,
      };
    }

    const publishingSplit =
      publishingSplitObj.writer || publishingSplitObj.publisher
        ? JSON.stringify(publishingSplitObj)
        : null;

    // -------- Escritura en BD --------
    await db.track.update({
      where: { id },
      data: {
        licenseType,
        territories,
        term,
        mediaBuy,
        master,
        mfn,
        contentIdEnrolled,
        contentIdAdmin,
        contentIdWhitelist,
        restrictions,
        publishingSplit,
      },
      select: { id: true },
    });

    // Revalidamos las vistas que usan estos datos
    revalidatePath(`/admin/track/${id}/edit`);
    revalidatePath(`/admin/track/${id}/rights`);
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
