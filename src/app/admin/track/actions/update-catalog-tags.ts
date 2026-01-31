"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

type Result =
  | { ok: true }
  | { ok: false; message: string };

export async function updateCatalogTags({
  trackId,
  slugs,
}: {
  trackId: string;
  slugs: string[];
}): Promise<Result> {
  if (!trackId) return { ok: false, message: "trackId requerido" };
  const cleanSlugs = Array.from(new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean)));

  try {
    const tags = await prisma.tag.findMany({
      where: { slug: { in: cleanSlugs }, type: "CATALOG" },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.trackTag.deleteMany({
        where: { trackId },
      }),
      tags.length
        ? prisma.trackTag.createMany({
            data: tags.map((t) => ({ trackId, tagId: t.id })),
          })
        : prisma.trackTag.deleteMany({ where: { trackId } }),
    ]);

    revalidatePath(`/admin/track/${trackId}/edit`);
    return { ok: true };
  } catch (e) {
    console.error("[updateCatalogTags] error", e);
    return { ok: false, message: "No se pudieron guardar los tags" };
  }
}
