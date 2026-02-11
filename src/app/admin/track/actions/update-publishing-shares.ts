"use server";

import { revalidatePath } from "next/cache";
import { PublishingRole } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

const shareSchema = z.object({
  role: z.enum(["WRITER", "PUBLISHER"]),
  name: z.string().min(1, "Nombre requerido"),
  sharePct: z.number().int().min(0).max(100).nullable(),
  ipiNumber: z.string().nullable().optional(),
  pro: z.string().nullable().optional(),
  caeNumber: z.string().nullable().optional(),
  sortOrder: z.number().int().nullable().optional(),
});

const payloadSchema = z.object({
  trackId: z.string().min(1),
  shares: z.array(shareSchema),
  oneStop: z.boolean().optional(),
});

type Result =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function updatePublishingShares(input: unknown): Promise<Result> {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Validación: revisa los datos de publishing.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { trackId, shares, oneStop } = parsed.data;

  const writerSum = shares
    .filter((s) => s.role === "WRITER" && typeof s.sharePct === "number")
    .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);
  const publisherSum = shares
    .filter((s) => s.role === "PUBLISHER" && typeof s.sharePct === "number")
    .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);

  if (oneStop && (writerSum !== 100 || publisherSum !== 100)) {
    return {
      ok: false,
      message: "One-Stop activo: Writer y Publisher deben sumar 100% cada uno.",
      fieldErrors: {
        publishingShares: ["Debe sumar 100% Writer y 100% Publisher"],
      },
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.publishingShare.deleteMany({
        where: { trackId, role: { in: [PublishingRole.WRITER, PublishingRole.PUBLISHER] } },
      });

      if (shares.length) {
        await tx.publishingShare.createMany({
          data: shares.map((s, idx) => ({
            trackId,
            role: s.role,
            name: s.name,
            sharePct: s.sharePct,
            ipiNumber: s.ipiNumber ?? null,
            pro: s.pro ?? null,
            caeNumber: s.caeNumber ?? null,
            sortOrder: s.sortOrder ?? idx,
          })),
        });
      }
    });

    revalidatePath(`/admin/tracks/${trackId}/edit`);
    revalidatePath("/admin/tracks");
    return { ok: true };
  } catch (err) {
    console.error("[updatePublishingShares] fatal", err);
    return { ok: false, message: "Error al guardar publishing shares." };
  }
}
