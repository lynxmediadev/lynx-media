import { TagType } from "@prisma/client";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

type TagInput = {
  slug: string;
  name: string;
};

type SyncedTag = {
  id: string;
  slug: string;
  name: string;
};

function normalizeInputs(inputs: TagInput[]): TagInput[] {
  const bySlug = new Map<string, TagInput>();
  for (const raw of inputs) {
    const slug = raw.slug.trim();
    const name = raw.name.trim();
    if (!slug || !name) continue;
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, name });
  }
  return Array.from(bySlug.values());
}

/**
 * Sincroniza un set de tags para un track y un tipo concreto.
 * - Crea tags faltantes.
 * - Normaliza tipo/nombre cuando el slug ya existia.
 * - Reemplaza la asignacion del track para ese tipo.
 */
export async function syncTrackTagsByType(params: {
  trackId: string;
  type: TagType;
  inputs: TagInput[];
}): Promise<SyncedTag[]> {
  return db.$transaction(async (tx) => {
    return syncTrackTagsByTypeWithTx(tx, params);
  });
}

export async function syncTrackTagsByTypeWithTx(
  tx: Prisma.TransactionClient,
  params: {
    trackId: string;
    type: TagType;
    inputs: TagInput[];
  },
): Promise<SyncedTag[]> {
  const cleanInputs = normalizeInputs(params.inputs);
  if (!cleanInputs.length) {
    await tx.trackTag.deleteMany({
      where: { trackId: params.trackId, tag: { type: params.type } },
    });
    return [];
  }

  const orderedSlugs = cleanInputs.map((item) => item.slug);
  const desiredBySlug = new Map(cleanInputs.map((item) => [item.slug, item.name]));

  const existing = await tx.tag.findMany({
    where: { slug: { in: orderedSlugs } },
    select: { id: true, slug: true, name: true, type: true },
  });

  const existingBySlug = new Map(existing.map((item) => [item.slug, item]));

  const toCreate = cleanInputs
    .filter((item) => !existingBySlug.has(item.slug))
    .map((item) => ({ slug: item.slug, name: item.name, type: params.type }));

  if (toCreate.length) {
    await tx.tag.createMany({ data: toCreate, skipDuplicates: true });
  }

  const toUpdate = existing.filter((item) => {
    const desiredName = desiredBySlug.get(item.slug);
    if (!desiredName) return false;
    return item.type !== params.type || item.name !== desiredName;
  });

  if (toUpdate.length) {
    await Promise.all(
      toUpdate.map((item) =>
        tx.tag.update({
          where: { id: item.id },
          data: {
            type: params.type,
            name: desiredBySlug.get(item.slug) ?? item.name,
          },
        }),
      ),
    );
  }

  const finalTags = await tx.tag.findMany({
    where: { slug: { in: orderedSlugs }, type: params.type },
    select: { id: true, slug: true, name: true },
  });

  const finalBySlug = new Map(finalTags.map((item) => [item.slug, item]));
  const orderedTags = orderedSlugs
    .map((slug) => finalBySlug.get(slug))
    .filter((item): item is SyncedTag => Boolean(item));

  const currentLinks = await tx.trackTag.findMany({
    where: { trackId: params.trackId, tag: { type: params.type } },
    select: { tagId: true },
  });
  const currentSet = new Set(currentLinks.map((item) => item.tagId));
  const desiredSet = new Set(orderedTags.map((item) => item.id));

  const toDelete = Array.from(currentSet).filter((tagId) => !desiredSet.has(tagId));
  const toInsert = orderedTags.filter((tag) => !currentSet.has(tag.id));

  if (toDelete.length) {
    await tx.trackTag.deleteMany({
      where: {
        trackId: params.trackId,
        tagId: { in: toDelete },
      },
    });
  }

  if (toInsert.length) {
    await tx.trackTag.createMany({
      data: toInsert.map((tag) => ({ trackId: params.trackId, tagId: tag.id })),
      skipDuplicates: true,
    });
  }

  return orderedTags;
}
