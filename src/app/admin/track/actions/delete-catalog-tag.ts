"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffAction } from "@/lib/account-auth/guards";

type Result = { ok: true } | { ok: false; message: string };

export async function deleteCatalogTag({
  id,
  trackId,
}: {
  id: string;
  trackId: string;
}): Promise<Result> {
  try {
    await requireAdminOrStaffAction();
  } catch {
    return { ok: false, message: "No autorizado" };
  }

  if (!id) return { ok: false, message: "ID requerido" };
  try {
    await prisma.tag.delete({ where: { id } });
    revalidatePath(`/admin/tracks/${trackId}/edit`);
    return { ok: true };
  } catch (e) {
    console.error("[deleteCatalogTag] error", e);
    return { ok: false, message: "No se pudo eliminar la categoría" };
  }
}
