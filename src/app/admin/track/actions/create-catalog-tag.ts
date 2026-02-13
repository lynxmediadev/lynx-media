"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffAction } from "@/lib/account-auth/guards";

type Result =
  | { ok: true; tag: { id: string; slug: string; name: string } }
  | { ok: false; message: string };

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCatalogTag({
  name,
  trackId,
}: {
  name: string;
  trackId: string;
}): Promise<Result> {
  try {
    await requireAdminOrStaffAction();
  } catch {
    return { ok: false, message: "No autorizado" };
  }

  const cleanName = name.trim();
  if (!cleanName) return { ok: false, message: "Nombre requerido" };

  const slug = slugify(cleanName);
  if (!slug) return { ok: false, message: "Slug inválido" };

  try {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name: cleanName, type: "CATALOG" },
      create: { slug, name: cleanName, type: "CATALOG" },
      select: { id: true, slug: true, name: true },
    });

    // Revalida la página de edición para refrescar checkboxes
    revalidatePath(`/admin/tracks/${trackId}/edit`);
    return { ok: true, tag };
  } catch (e) {
    console.error("[createCatalogTag] error", e);
    return { ok: false, message: "Error al crear la categoría" };
  }
}
