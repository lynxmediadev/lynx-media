import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import {
  canRoleManageAnyPlaylists,
  canRoleManageOwnPlaylists,
} from "@/lib/playlists/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const addSchema = z.object({
  trackId: z.string().trim().min(1),
});

const removeSchema = z.object({
  trackId: z.string().trim().min(1),
});

const reorderSchema = z.object({
  trackId: z.string().trim().min(1),
  sortOrder: z.number().int().min(1).max(9999),
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

async function isAutoPlaylist(playlistId: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { isAutoAllTracks: true },
  });
  return Boolean(playlist?.isAutoAllTracks);
}

async function revalidatePlaylistPaths(playlistId: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { id: true, publicId: true, isMainCatalog: true },
  });
  revalidatePath("/admin/playlists");
  revalidatePath(`/admin/playlists/${playlistId}`);
  revalidatePath("/creator/playlists");
  revalidatePath(`/creator/playlists/${playlistId}`);
  if (playlist?.publicId) {
    revalidatePath(`/playlist/${playlist.publicId}`);
  }
  if (playlist?.isMainCatalog) {
    revalidatePath("/catalog");
  }
}

async function canUseTrack(params: {
  userId: string;
  role: UserRole;
  trackId: string;
}) {
  if (canRoleManageAnyPlaylists(params.role)) return true;
  if (!canRoleManageOwnPlaylists(params.role)) return false;
  const track = await prisma.track.findUnique({
    where: { id: params.trackId },
    select: { ownerUserId: true },
  });
  return Boolean(track && track.ownerUserId === params.userId);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canRoleManageOwnPlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await context.params;
  const hasPlaylistAccess = await canAccessPlaylist({
    userId: user.id,
    role: user.role,
    playlistId,
  });
  if (!hasPlaylistAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (await isAutoPlaylist(playlistId)) {
    return NextResponse.json(
      { ok: false, error: "La playlist automática no admite cambios manuales." },
      { status: 400 },
    );
  }

  const payload = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const canTrack = await canUseTrack({
    userId: user.id,
    role: user.role,
    trackId: parsed.data.trackId,
  });
  if (!canTrack) {
    return NextResponse.json({ ok: false, error: "Track no autorizado" }, { status: 403 });
  }

  const maxOrder = await prisma.playlistTrack.aggregate({
    where: { playlistId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

  await prisma.playlistTrack.upsert({
    where: { playlistId_trackId: { playlistId, trackId: parsed.data.trackId } },
    update: { sortOrder },
    create: {
      playlistId,
      trackId: parsed.data.trackId,
      sortOrder,
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
  const hasPlaylistAccess = await canAccessPlaylist({
    userId: user.id,
    role: user.role,
    playlistId,
  });
  if (!hasPlaylistAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (await isAutoPlaylist(playlistId)) {
    return NextResponse.json(
      { ok: false, error: "La playlist automática no admite cambios manuales." },
      { status: 400 },
    );
  }

  const payload = await req.json().catch(() => null);
  const parsed = removeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.playlistTrack.deleteMany({
    where: { playlistId, trackId: parsed.data.trackId },
  });
  await revalidatePlaylistPaths(playlistId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canRoleManageOwnPlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await context.params;
  const hasPlaylistAccess = await canAccessPlaylist({
    userId: user.id,
    role: user.role,
    playlistId,
  });
  if (!hasPlaylistAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (await isAutoPlaylist(playlistId)) {
    return NextResponse.json(
      { ok: false, error: "La playlist automática no admite cambios manuales." },
      { status: 400 },
    );
  }

  const payload = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.playlistTrack.update({
    where: {
      playlistId_trackId: {
        playlistId,
        trackId: parsed.data.trackId,
      },
    },
    data: { sortOrder: parsed.data.sortOrder },
  });
  await revalidatePlaylistPaths(playlistId);
  return NextResponse.json({ ok: true });
}
