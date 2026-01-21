"use server";

import { revalidatePath } from "next/cache";
import { PublishingRole } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  creativeFormSchema,
  deliverablesFormSchema,
  idsFormSchema,
  rightsFormSchema,
  syncMetaFormSchema,
  type CreativeFormValues,
  type DeliverablesFormValues,
  type IdsFormValues,
  type RightsFormValues,
  type SyncMetaFormValues,
} from "@/lib/validation/trackSchemas";

type UpdateAllResult = {
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
    if (!target[key]) {
      target[key] = [...errors];
    } else {
      target[key].push(...errors);
    }
  }
}

export async function updateTrackAll(
  formData: FormData,
): Promise<UpdateAllResult> {
  try {
    const rawObject = Object.fromEntries(formData.entries());

    const creativeParsed = creativeFormSchema.safeParse(rawObject);
    const idsParsed = idsFormSchema.safeParse(rawObject);
    const rightsParsed = rightsFormSchema.safeParse(rawObject);
    const syncParsed = syncMetaFormSchema.safeParse(rawObject);
    const deliverablesParsed = deliverablesFormSchema.safeParse(rawObject);

    const fieldErrors: Record<string, string[]> = {};

    if (!creativeParsed.success) {
      mergeFieldErrors(fieldErrors, creativeParsed.error.flatten().fieldErrors);
    }
    if (!idsParsed.success) {
      mergeFieldErrors(fieldErrors, idsParsed.error.flatten().fieldErrors);
    }
    if (!rightsParsed.success) {
      mergeFieldErrors(fieldErrors, rightsParsed.error.flatten().fieldErrors);
    }
    if (!syncParsed.success) {
      mergeFieldErrors(fieldErrors, syncParsed.error.flatten().fieldErrors);
    }
    if (!deliverablesParsed.success) {
      mergeFieldErrors(fieldErrors, deliverablesParsed.error.flatten().fieldErrors);
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        message: "Hay errores de validación en el formulario.",
        fieldErrors,
      };
    }

    const creativeData: CreativeFormValues = creativeParsed.data;
    const idsData: IdsFormValues = idsParsed.data;
    const rightsData: RightsFormValues = rightsParsed.data;
    const syncData: SyncMetaFormValues = syncParsed.data;
    const deliverablesData: DeliverablesFormValues = deliverablesParsed.data;

    const trackId = syncData.id;

    if (
      rightsData.id !== trackId ||
      deliverablesData.id !== trackId
    ) {
      return {
        ok: false,
        message: "El ID del track no coincide entre secciones.",
      };
    }

    const sharesToCreate: {
      role: PublishingRole;
      name: string;
      ipiNumber: string | null;
      pro?: string | null;
      caeNumber?: string | null;
      sharePct: number | null;
    }[] = [];

    if (
      rightsData.writerName ||
      rightsData.writerSharePct !== null ||
      rightsData.writerIpiNumber
    ) {
      sharesToCreate.push({
        role: PublishingRole.WRITER,
        name: rightsData.writerName,
        ipiNumber: rightsData.writerIpiNumber,
        pro: rightsData.writerPro,
        caeNumber: rightsData.writerCaeNumber,
        sharePct: rightsData.writerSharePct,
      });
    }

    if (
      rightsData.publisherName ||
      rightsData.publisherSharePct !== null ||
      rightsData.publisherIpiNumber
    ) {
      sharesToCreate.push({
        role: PublishingRole.PUBLISHER,
        name: rightsData.publisherName,
        ipiNumber: rightsData.publisherIpiNumber,
        pro: rightsData.publisherPro,
        caeNumber: rightsData.publisherCaeNumber,
        sharePct: rightsData.publisherSharePct,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.track.update({
        where: { id: trackId },
        data: {
          title: creativeData.title,
          artist: creativeData.artist,
          moods: creativeData.moods,
          uses: creativeData.uses,
          isrc: idsData.isrc,
          iswc: idsData.iswc,
          upc: idsData.upc,

          mfn: rightsData.mfn,
          master: rightsData.master,
          oneStop: rightsData.oneStop,
          clearedForSync: rightsData.clearedForSync,
          contentIdEnrolled: rightsData.contentIdEnrolled,
          contentIdAdmin: rightsData.contentIdAdmin,
          contentIdWhitelist: rightsData.contentIdWhitelist,

          licenseType: syncData.licenseType,
          mediaBuy: syncData.mediaBuy,
          bpm: syncData.bpm ?? null,
          key: syncData.key,
          trackType: syncData.trackType,
          genres: syncData.genres,
          subgenres: syncData.subgenres,
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

      await tx.publishingShare.deleteMany({
        where: {
          trackId,
          role: { in: [PublishingRole.WRITER, PublishingRole.PUBLISHER] },
        },
      });

      if (sharesToCreate.length > 0) {
        await tx.publishingShare.createMany({
          data: sharesToCreate.map((share) => ({
            trackId,
            role: share.role,
            name: share.name,
            ipiNumber: share.ipiNumber,
            pro: share.pro ?? null,
            caeNumber: share.caeNumber ?? null,
            sharePct: share.sharePct,
          })),
        });
      }

      await tx.trackVersion.deleteMany({ where: { trackId } });
      await tx.trackStem.deleteMany({ where: { trackId } });

      if (deliverablesData.versions.length > 0) {
        await tx.trackVersion.createMany({
          data: deliverablesData.versions.map((version) => ({
            trackId,
            label: version.label,
            durationSec: version.durationSec ?? null,
            kind: version.kind ?? null,
            sortOrder: version.sortOrder ?? null,
          })),
        });
      }

      if (deliverablesData.stems.length > 0) {
        await tx.trackStem.createMany({
          data: deliverablesData.stems.map((stem) => ({
            trackId,
            name: stem.name,
            group: stem.group ?? null,
            sortOrder: stem.sortOrder ?? null,
          })),
        });
      }
    });

    revalidatePath(`/admin/track/${trackId}/edit`);
    revalidatePath("/admin/tracks");

    return {
      ok: true,
      message: "Guardado",
    };
  } catch (err) {
    console.error("[track:edit:updateTrackAll] fatal:", err);
    return {
      ok: false,
      message: "Error al guardar todos los cambios.",
    };
  }
}
