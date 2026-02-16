import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import {
  canRoleManageAnyPlaylists,
  canRoleManageOwnPlaylists,
} from "@/lib/playlists/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const addShareSchema = z.object({
  email: z.string().trim().email(),
  canEdit: z.boolean().optional(),
});

const removeShareSchema = z.object({
  userId: z.string().trim().min(1),
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

async function revalidatePlaylistPaths(playlistId: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { publicId: true, isMainCatalog: true },
  });
  revalidatePath(`/admin/playlists/${playlistId}`);
  revalidatePath(`/creator/playlists/${playlistId}`);
  if (playlist?.publicId) {
    revalidatePath(`/playlist/${playlist.publicId}`);
  }
  if (playlist?.isMainCatalog) {
    revalidatePath("/catalog");
  }
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canRoleManageOwnPlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id: playlistId } = await context.params;
  const hasAccess = await canAccessPlaylist({
    userId: user.id,
    role: user.role,
    playlistId,
  });
  if (!hasAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const shares = await prisma.playlistViewer.findMany({
    where: { playlistId },
    orderBy: { createdAt: "asc" },
    select: {
      userId: true,
      canEdit: true,
      createdAt: true,
      user: { select: { email: true, role: true, name: true } },
    },
  });
  return NextResponse.json({ ok: true, items: shares });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canRoleManageOwnPlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id: playlistId } = await context.params;
  const hasAccess = await canAccessPlaylist({
    userId: user.id,
    role: user.role,
    playlistId,
  });
  if (!hasAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = addShareSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
  }

  await prisma.playlistViewer.upsert({
    where: {
      playlistId_userId: {
        playlistId,
        userId: targetUser.id,
      },
    },
    update: {
      canEdit: parsed.data.canEdit ?? false,
    },
    create: {
      playlistId,
      userId: targetUser.id,
      canEdit: parsed.data.canEdit ?? false,
    },
  });

  await revalidatePlaylistPaths(playlistId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canRoleManageOwnPlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id: playlistId } = await context.params;
  const hasAccess = await canAccessPlaylist({
    userId: user.id,
    role: user.role,
    playlistId,
  });
  if (!hasAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = removeShareSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.playlistViewer.deleteMany({
    where: { playlistId, userId: parsed.data.userId },
  });
  await revalidatePlaylistPaths(playlistId);
  return NextResponse.json({ ok: true });
}
