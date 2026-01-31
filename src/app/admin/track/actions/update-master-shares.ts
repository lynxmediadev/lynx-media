"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";

const masterShareSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  sharePct: z.number().int().min(0).max(100).nullable(),
  contact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const payloadSchema = z.object({
  trackId: z.string().min(1),
  shares: z.array(masterShareSchema),
});

type Result =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function updateMasterShares(input: unknown): Promise<Result> {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Validación: revisa los datos de master.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const { trackId, shares } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.masterShare.deleteMany({ where: { trackId } });
      if (shares.length) {
        await tx.masterShare.createMany({
          data: shares.map((s) => ({
            trackId,
            name: s.name,
            sharePct: s.sharePct,
            contact: s.contact ?? null,
            notes: s.notes ?? null,
          })),
        });
      }
    });
    revalidatePath(`/admin/track/${trackId}/edit`);
    revalidatePath("/admin/tracks");
    return { ok: true };
  } catch (err) {
    console.error("[updateMasterShares] fatal", err);
    return { ok: false, message: "Error al guardar master shares." };
  }
}
