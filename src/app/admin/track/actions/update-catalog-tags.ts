"use server";

import { revalidatePath } from "next/cache";
import { TagType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffAction } from "@/lib/account-auth/guards";
import { syncTrackTagsByTypeWithTx } from "@/server/tags/syncTrackTagsByType";

type Result =
  | { ok: true; items: { id: string; slug: string; name: string }[] }
  | { ok: false; message: string };

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function nameFromSlug(slug: string) {
  return slug.replace(/-/g, " ").toUpperCase();
}

export async function updateCatalogTags({
  trackId,
  slugs,
}: {
  trackId: string;
  slugs: string[];
}): Promise<Result> {
  try {
    await requireAdminOrStaffAction();
  } catch {
    return { ok: false, message: "No autorizado" };
  }

  if (!trackId) return { ok: false, message: "Track inválido" };

  const cleanSlugs = Array.from(
    new Set(
      (slugs ?? [])
        .map((slug) => normalizeSlug(slug))
        .filter(Boolean),
    ),
  );

  try {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });
    if (!track) return { ok: false, message: "Track no encontrado" };

    const items = await prisma.$transaction(async (tx) => {
      const existing = await tx.tag.findMany({
        where: {
          type: TagType.CATALOG,
          slug: { in: cleanSlugs },
        },
        select: { slug: true, name: true },
      });
      const existingBySlug = new Map(existing.map((tag) => [tag.slug, tag.name]));
      return syncTrackTagsByTypeWithTx(tx, {
        trackId,
        type: TagType.CATALOG,
        inputs: cleanSlugs.map((slug) => ({
          slug,
          name: existingBySlug.get(slug) ?? nameFromSlug(slug),
        })),
      });
    });

    revalidatePath(`/admin/tracks/${trackId}/edit`);
    return { ok: true, items };
  } catch (error) {
    console.error("[updateCatalogTags] error", error);
    return { ok: false, message: "No se pudieron actualizar las categorías" };
  }
}
