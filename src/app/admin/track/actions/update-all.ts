"use server";

import { revalidatePath } from "next/cache";
import { PublishingRole, TagType } from "@prisma/client";

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

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function updateTrackAll(
  formData: FormData,
): Promise<UpdateAllResult> {
  try {
    const rawObject = Object.fromEntries(formData.entries());
    const catalogTagSlugs = Array.from(
      new Set(
        formData
          .getAll("catalogTags")
          .map((v) => (typeof v === "string" ? v.trim() : ""))
          .filter((v) => v.length > 0),
      ),
    );

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
    if (!trackId) {
      return { ok: false, message: "Falta el ID del track." };
    }

    if (
      rightsData.id !== trackId ||
      deliverablesData.id !== trackId
    ) {
      return {
        ok: false,
        message: "El ID del track no coincide entre secciones.",
      };
    }

    // Validar tags de catálogo contra BD (solo tipo CATALOG)
    const validCatalogTags = await prisma.tag.findMany({
      where: { type: TagType.CATALOG },
      select: { id: true, slug: true },
    });
    const validSlugs = new Set(validCatalogTags.map((t) => t.slug));
    const unknown = catalogTagSlugs.filter((slug) => !validSlugs.has(slug));
    if (unknown.length > 0) {
      return {
        ok: false,
        message: "Hay tags de catálogo no válidos.",
        fieldErrors: { catalogTags: ["Selecciona tags de catálogo válidos."] },
      };
    }
    const tagIdsToSet = validCatalogTags
      .filter((t) => catalogTagSlugs.includes(t.slug))
      .map((t) => t.id);

    const sharesToCreate =
      rightsData.publishingShares?.map((s) => ({
        role: s.role as PublishingRole,
        name: s.name,
        ipiNumber: s.ipiNumber ?? null,
        pro: s.pro ?? null,
        caeNumber: s.caeNumber ?? null,
        sharePct: s.sharePct ?? null,
        sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : null,
      })) ?? [];

    const writerSum = sharesToCreate
      .filter((s) => s.role === PublishingRole.WRITER && typeof s.sharePct === "number")
      .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);
    const publisherSum = sharesToCreate
      .filter((s) => s.role === PublishingRole.PUBLISHER && typeof s.sharePct === "number")
      .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);

    const is100 = (val: number) => Math.abs(val - 100) < 0.01; // tolera redondeo

    const masterSharesToCreate =
      rightsData.masterShares?.map((s) => ({
        name: s.name,
        sharePct: s.sharePct ?? null,
        contact: s.contact ?? null,
        notes: s.notes ?? null,
        sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : null,
      })) ?? [];

    const publishingBlocked =
      rightsData.oneStop && (!is100(writerSum) || !is100(publisherSum));

    // Moods → IDs (máx 10, sin duplicados; nombre en MAYÚSCULAS)
    const moodNames = (creativeData.moods ?? []).map((m) => m.toUpperCase());
    if (moodNames.length > 10) {
      return {
        ok: false,
        message: "Máximo 10 moods por track.",
        fieldErrors: { moods: ["Máximo 10 moods por track."] },
      };
    }

    const foundMoods = await prisma.mood.findMany({
      where: { name: { in: moodNames, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
    });
    const foundNames = new Set(foundMoods.map((m) => m.name.toLowerCase()));
    const missing = moodNames.filter((n) => !foundNames.has(n.toLowerCase()));

    if (missing.length > 0) {
      for (const name of missing) {
        const slug = slugify(name);
        await prisma.mood.upsert({
          where: { slug },
          update: { name },
          create: { name, slug },
        });
      }
    }

    const moodRecords = await prisma.mood.findMany({
      where: { name: { in: moodNames, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    const moodIds = moodRecords.map((m) => m.id);

    await prisma.$transaction(async (tx) => {
      await tx.track.update({
        where: { id: trackId },
        data: {
          title: creativeData.title,
          artist: creativeData.artist,
          moods: moodNames, // compat con campo string[]
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

      if (!publishingBlocked) {
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
              sortOrder: share.sortOrder,
            })),
          });
        }
      }

      await tx.masterShare.deleteMany({ where: { trackId } });
      if (masterSharesToCreate.length > 0) {
        await tx.masterShare.createMany({
          data: masterSharesToCreate.map((ms) => ({
            trackId,
            name: ms.name,
            sharePct: ms.sharePct,
            contact: ms.contact,
            notes: ms.notes,
            sortOrder: ms.sortOrder,
          })),
        });
      }

      // Sync TrackMood pivote
      await tx.trackMood.deleteMany({ where: { trackId } });
      if (moodIds.length > 0) {
        await tx.trackMood.createMany({
          data: moodIds.map((moodId) => ({ trackId, moodId })),
        });
      }

      // Reemplazar tags de catálogo
      await tx.trackTag.deleteMany({
        where: { trackId, tag: { type: TagType.CATALOG } },
      });
      if (tagIdsToSet.length > 0) {
        await tx.trackTag.createMany({
          data: tagIdsToSet.map((tagId) => ({
            trackId,
            tagId,
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
      message: publishingBlocked
        ? `Guardado parcial: Publishing no se guardó (One-Stop requiere 100/100). Writer: ${writerSum}%, Publisher: ${publisherSum}%. Ajusta porcentajes.`
        : "Guardado",
      fieldErrors: publishingBlocked
        ? {
            publishingShares: [
              `One-Stop activo: WRITER=${writerSum}% PUBLISHER=${publisherSum}% (debe ser 100/100). Publishing no se guardó.`,
            ],
          }
        : undefined,
    };
  } catch (err) {
    console.error("[track:edit:updateTrackAll] fatal:", err);
    return {
      ok: false,
      message: "Error al guardar todos los cambios.",
    };
  }
}
