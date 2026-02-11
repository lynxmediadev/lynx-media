"use server";

import { revalidatePath } from "next/cache";
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
    publishingShares,
    masterShares,
  } = data;

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
          role: { in: ["WRITER", "PUBLISHER"] },
        },
      }),
    );

    if (publishingShares.length > 0) {
      const writerSum = publishingShares
        .filter((s) => s.role === "WRITER" && typeof s.sharePct === "number")
        .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);
      const publisherSum = publishingShares
        .filter((s) => s.role === "PUBLISHER" && typeof s.sharePct === "number")
        .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);
      if (oneStop && (writerSum !== 100 || publisherSum !== 100)) {
        return {
          ok: false,
          message:
            "One-Stop activo: Writer y Publisher deben sumar 100% cada uno.",
          fieldErrors: {
            publishingShares: [
              "Debe sumar 100% Writer y 100% Publisher para One-Stop",
            ],
          },
        };
      }
      tx.push(
        prisma.publishingShare.createMany({
          data: publishingShares.map((s) => ({
            trackId,
            role: s.role as any,
            name: s.name,
            ipiNumber: s.ipiNumber ?? null,
            pro: s.pro ?? null,
            caeNumber: s.caeNumber ?? null,
            sharePct: s.sharePct ?? null,
            sortOrder:
              typeof s.sortOrder === "number" ? s.sortOrder : null,
          })),
        }),
      );
    }

    tx.push(prisma.masterShare.deleteMany({ where: { trackId } }));
    if (masterShares.length > 0) {
      tx.push(
        prisma.masterShare.createMany({
          data: masterShares.map((s) => ({
            trackId,
            name: s.name,
            sharePct: s.sharePct ?? null,
            contact: s.contact ?? null,
            notes: s.notes ?? null,
            sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : null,
          })),
        }),
      );
    }

    await prisma.$transaction(tx);

    revalidatePath(`/admin/tracks/${trackId}/edit`);
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
