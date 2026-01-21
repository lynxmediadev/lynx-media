"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  deliverablesFormSchema,
  syncMetaFormSchema,
  type DeliverablesFormValues,
  type SyncMetaFormValues,
} from "@/lib/validation/trackSchemas";

type UpdateMetaResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateSyncMeta(
  formData: FormData,
): Promise<UpdateMetaResult> {
  try {
    const rawObject = Object.fromEntries(formData.entries());
    const parsed = syncMetaFormSchema.safeParse(rawObject);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return {
        ok: false,
        message: "Hay errores de validación en metadata sync.",
        fieldErrors,
      };
    }

    const data: SyncMetaFormValues = parsed.data;

    await prisma.track.update({
      where: { id: data.id },
      data: {
        licenseType: data.licenseType,
        mediaBuy: data.mediaBuy,
        bpm: data.bpm ?? null,
        key: data.key,
        trackType: data.trackType,
        genres: data.genres,
        subgenres: data.subgenres,
        exclusiveTerritories: data.exclusiveTerritories,
        exclusiveTermMonths: data.exclusiveTermMonths ?? null,
        restrictedTerritories: data.restrictedTerritories,
        restrictedIndustries: data.restrictedIndustries,
        restrictedPlatforms: data.restrictedPlatforms,
        restrictedBrands: data.restrictedBrands,
        restrictions: data.restrictions,
        pricingTier: data.pricingTier,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        budgetCurrency: data.budgetCurrency,
      },
      select: { id: true },
    });

    revalidatePath(`/admin/track/${data.id}/edit`);
    revalidatePath("/admin/tracks");

    return { ok: true, message: "Metadata sync actualizada" };
  } catch (err) {
    console.error("[track:meta:updateSyncMeta] fatal:", err);
    return {
      ok: false,
      message: "Error al guardar metadata sync.",
    };
  }
}

export async function updateDeliverables(
  formData: FormData,
): Promise<UpdateMetaResult> {
  try {
    const rawObject = Object.fromEntries(formData.entries());
    const parsed = deliverablesFormSchema.safeParse(rawObject);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return {
        ok: false,
        message: "Hay errores de validación en entregables.",
        fieldErrors,
      };
    }

    const data: DeliverablesFormValues = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.trackVersion.deleteMany({ where: { trackId: data.id } });
      await tx.trackStem.deleteMany({ where: { trackId: data.id } });

      if (data.versions.length) {
        await tx.trackVersion.createMany({
          data: data.versions.map((version) => ({
            trackId: data.id,
            label: version.label,
            durationSec: version.durationSec ?? null,
            kind: version.kind ?? null,
            sortOrder: version.sortOrder ?? null,
          })),
        });
      }

      if (data.stems.length) {
        await tx.trackStem.createMany({
          data: data.stems.map((stem) => ({
            trackId: data.id,
            name: stem.name,
            group: stem.group ?? null,
            sortOrder: stem.sortOrder ?? null,
          })),
        });
      }
    });

    revalidatePath(`/admin/track/${data.id}/edit`);
    revalidatePath("/admin/tracks");

    return { ok: true, message: "Entregables actualizados" };
  } catch (err) {
    console.error("[track:meta:updateDeliverables] fatal:", err);
    return {
      ok: false,
      message: "Error al guardar entregables.",
    };
  }
}
