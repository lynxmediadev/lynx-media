import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { PlaylistStatus, PlaylistVisibility, UserRole } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import {
  canRoleManageAnyPlaylists,
  canRoleManageOwnPlaylists,
  setMainCatalogPlaylist,
} from "@/lib/playlists/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function canManagePlaylists(role: UserRole) {
  return canRoleManageAnyPlaylists(role) || canRoleManageOwnPlaylists(role);
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.nativeEnum(PlaylistStatus).optional(),
  visibility: z.nativeEnum(PlaylistVisibility).optional(),
  embedEnabled: z.boolean().optional(),
  isMainCatalog: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

async function canAccessPlaylist(params: {
  userId: string;
  role: UserRole;
  playlistId: string;
}) {
  if (canRoleManageAnyPlaylists(params.role)) return true;
  if (!canRoleManageOwnPlaylists(params.role)) return false;
  const playlist = await prisma.playlist.findUnique({
    where: { id: params.playlistId },
    select: { ownerUserId: true },
  });
  return Boolean(playlist && playlist.ownerUserId === params.userId);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManagePlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const hasAccess = await canAccessPlaylist({ userId: user.id, role: user.role, playlistId: id });
  if (!hasAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const payload = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isMainCatalog && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Solo ADMIN puede cambiar el catálogo principal." },
      { status: 403 },
    );
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.visibility !== undefined ? { visibility: parsed.data.visibility } : {}),
      ...(parsed.data.embedEnabled !== undefined ? { embedEnabled: parsed.data.embedEnabled } : {}),
      ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      publicId: true,
      description: true,
      status: true,
      visibility: true,
      embedEnabled: true,
      isMainCatalog: true,
      featured: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  if (parsed.data.isMainCatalog === true && user.role === "ADMIN") {
    await setMainCatalogPlaylist(id);
    updated.isMainCatalog = true;
  }
  if (parsed.data.isMainCatalog === false && user.role === "ADMIN") {
    await prisma.playlist.update({ where: { id }, data: { isMainCatalog: false } });
    updated.isMainCatalog = false;
  }

  revalidatePath("/admin/playlists");
  revalidatePath(`/admin/playlists/${id}`);
  revalidatePath("/creator/playlists");
  revalidatePath(`/creator/playlists/${id}`);
  revalidatePath(`/playlist/${updated.publicId}`);
  if (updated.isMainCatalog || parsed.data.isMainCatalog !== undefined) {
    revalidatePath("/catalog");
  }

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManagePlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const hasAccess = await canAccessPlaylist({ userId: user.id, role: user.role, playlistId: id });
  if (!hasAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const current = await prisma.playlist.findUnique({
    where: { id },
    select: { publicId: true, isMainCatalog: true },
  });
  await prisma.playlist.delete({ where: { id } });

  revalidatePath("/admin/playlists");
  revalidatePath(`/admin/playlists/${id}`);
  revalidatePath("/creator/playlists");
  revalidatePath(`/creator/playlists/${id}`);
  if (current?.publicId) {
    revalidatePath(`/playlist/${current.publicId}`);
  }
  if (current?.isMainCatalog) {
    revalidatePath("/catalog");
  }

  return NextResponse.json({ ok: true });
}
