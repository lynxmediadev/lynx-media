"use server";

import { revalidatePath } from "next/cache";
import { PublishingRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  rightsFormSchema,
  type RightsFormValues,
} from "@/lib/validation/trackSchemas";

type UpdateRightsResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

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

    const {
      mfn,
      master,
      oneStop,
      clearedForSync,
      contentIdEnrolled,
      contentIdAdmin,
      contentIdWhitelist,
      writerName,
      writerSharePct,
      writerIpiNumber,
      writerPro,
      writerCaeNumber,
      publisherName,
      publisherSharePct,
      publisherIpiNumber,
      publisherPro,
      publisherCaeNumber,
    } = data;

    const sharesToCreate: {
      role: PublishingRole;
      name: string;
      ipiNumber: string | null;
      pro?: string | null;
      caeNumber?: string | null;
      sharePct: number | null;
    }[] = [];

    if (writerName || writerSharePct !== null || writerIpiNumber) {
      sharesToCreate.push({
        role: PublishingRole.WRITER,
        name: writerName,
        ipiNumber: writerIpiNumber,
        pro: writerPro,
        caeNumber: writerCaeNumber,
        sharePct: writerSharePct,
      });
    }

    if (publisherName || publisherSharePct !== null || publisherIpiNumber) {
      sharesToCreate.push({
        role: PublishingRole.PUBLISHER,
        name: publisherName,
        ipiNumber: publisherIpiNumber,
        pro: publisherPro,
        caeNumber: publisherCaeNumber,
        sharePct: publisherSharePct,
      });
    }

    const tx = [];

    tx.push(
      prisma.track.update({
        where: { id: trackId },
        data: {
          mfn,
          master,
          oneStop,
          clearedForSync,
          contentIdEnrolled,
          contentIdAdmin,
          contentIdWhitelist,
        },
        select: { id: true },
      }),
    );

    tx.push(
      prisma.publishingShare.deleteMany({
        where: {
          trackId,
          role: { in: [PublishingRole.WRITER, PublishingRole.PUBLISHER] },
        },
      }),
    );

    if (sharesToCreate.length > 0) {
      tx.push(
        prisma.publishingShare.createMany({
          data: sharesToCreate.map((s) => ({
            trackId,
            role: s.role,
            name: s.name,
            ipiNumber: s.ipiNumber,
            pro: s.pro ?? null,
            caeNumber: s.caeNumber ?? null,
            sharePct: s.sharePct,
          })),
        }),
      );
    }

    await prisma.$transaction(tx);

    revalidatePath(`/admin/track/${trackId}/edit`);
    revalidatePath("/admin/tracks");

    return { ok: true, message: "Derechos actualizados" };
  } catch (err) {
    console.error("[track:rights:updateRights] fatal:", err);
    return {
      ok: false,
      message: "Error al guardar derechos. Revisa logs del servidor.",
    };
  }
}
