"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  idsFormSchema,
  deliverablesFormSchema,
  syncMetaFormSchema,
  type IdsFormValues,
  type DeliverablesFormValues,
  type SyncMetaFormValues,
} from "@/lib/validation/trackSchemas";

type UpdateMetaResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function mergeFieldErrors(
  target: Record<string, string[]>,
  source: Record<string, string[]>,
) {
  for (const [key, errors] of Object.entries(source)) {
    if (!errors || errors.length === 0) continue;
    if (!target[key]) target[key] = [];
    target[key].push(...errors);
  }
}

export async function updateMetadataModule(
  formData: FormData,
): Promise<UpdateMetaResult> {
  try {
    const rawObject = Object.fromEntries(formData.entries());

    const idsParsed = idsFormSchema.safeParse(rawObject);
    const syncParsed = syncMetaFormSchema.safeParse(rawObject);

    const fieldErrors: Record<string, string[]> = {};

    if (!idsParsed.success) {
      mergeFieldErrors(fieldErrors, idsParsed.error.flatten().fieldErrors);
    }
    if (!syncParsed.success) {
      mergeFieldErrors(fieldErrors, syncParsed.error.flatten().fieldErrors);
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        message: "Hay errores de validacion en Metadata.",
        fieldErrors,
      };
    }

    if (!(idsParsed.success && syncParsed.success)) {
      return {
        ok: false,
        message: "No se pudo validar Metadata.",
        fieldErrors,
      };
    }

    const idsData: IdsFormValues = idsParsed.data;
    const syncData: SyncMetaFormValues = syncParsed.data;
    const trackId = syncData.id;

    if (!trackId) {
      return {
        ok: false,
        message: "Falta el ID del track.",
      };
    }

    await prisma.track.update({
      where: { id: trackId },
      data: {
        isrc: idsData.isrc,
        iswc: idsData.iswc,
        upc: idsData.upc,
        licenseType: syncData.licenseType,
        mediaBuy: syncData.mediaBuy,
        exclusiveTerritories: syncData.exclusiveTerritories,
        exclusiveTermMonths: syncData.exclusiveTermMonths ?? null,
        restrictedTerritories: syncData.restrictedTerritories,
        restrictedIndustries: syncData.restrictedIndustries,
        restrictedPlatforms: syncData.restrictedPlatforms,
        restrictedBrands: syncData.restrictedBrands,
        restrictions: syncData.restrictions,
        pricingTier: syncData.pricingTier,
        budgetMin: syncData.budgetMin ?? null,
        budgetMax: syncData.budgetMax ?? null,
        budgetCurrency: syncData.budgetCurrency,
      },
      select: { id: true },
    });

    revalidatePath(`/admin/tracks/${trackId}/edit`);
    revalidatePath(`/admin/tracks/${trackId}/edit/metadata`);
    revalidatePath(`/admin/tracks/${trackId}/edit/full`);
    revalidatePath("/admin/tracks");

    return { ok: true, message: "Metadata actualizada" };
  } catch (err) {
    console.error("[track:meta:updateMetadataModule] fatal:", err);
    return {
      ok: false,
      message: "Error al guardar Metadata.",
    };
  }
}

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

    revalidatePath(`/admin/tracks/${data.id}/edit`);
    revalidatePath(`/admin/tracks/${data.id}/edit/metadata`);
    revalidatePath(`/admin/tracks/${data.id}/edit/full`);
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

    revalidatePath(`/admin/tracks/${data.id}/edit`);
    revalidatePath(`/admin/tracks/${data.id}/edit/deliverables`);
    revalidatePath(`/admin/tracks/${data.id}/edit/full`);
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
