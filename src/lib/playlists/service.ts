import "server-only";

import crypto from "node:crypto";
import type { Prisma, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const PLAYLIST_PUBLIC_ID_LEN = 10;

function randomPublicId(length = PLAYLIST_PUBLIC_ID_LEN) {
  return crypto
    .randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length)
    .toLowerCase();
}

export function canRoleManageOwnPlaylists(role: UserRole) {
  return role === "ADMIN" || role === "STAFF" || role === "CREATOR";
}

export function canRoleManageAnyPlaylists(role: UserRole) {
  return role === "ADMIN" || role === "STAFF";
}

export async function generateUniquePlaylistPublicId(tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;
  for (let i = 0; i < 8; i += 1) {
    const candidate = randomPublicId();
    const exists = await db.playlist.findUnique({
      where: { publicId: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

function buildDefaultPlaylistSlug(userId: string) {
  return `all-tracks-${slugify(userId).slice(0, 12)}`;
}

export async function ensureDefaultAllTracksPlaylistForUser(params: {
  userId: string;
  role: UserRole;
  userName?: string | null;
}) {
  if (!canRoleManageOwnPlaylists(params.role)) return null;

  const existing = await prisma.playlist.findFirst({
    where: { ownerUserId: params.userId, isAutoAllTracks: true },
    select: { id: true },
  });
  if (existing) return existing.id;

  const publicId = await generateUniquePlaylistPublicId();
  const ownerToken = params.userName?.trim() || params.userId.slice(-6);
  const rawName = `All Tracks · ${ownerToken}`;
  const name = rawName.slice(0, 120);

  const created = await prisma.playlist.create({
    data: {
      name,
      slug: buildDefaultPlaylistSlug(params.userId),
      publicId,
      description: "Playlist automática con todos los tracks del owner.",
      status: "PUBLISHED",
      visibility: "INTERNAL",
      embedEnabled: true,
      isAutoAllTracks: true,
      featured: false,
      sortOrder: 0,
      ownerUserId: params.userId,
    },
    select: { id: true },
  });

  return created.id;
}

export async function setMainCatalogPlaylist(playlistId: string) {
  await prisma.$transaction([
    prisma.playlist.updateMany({
      where: { isMainCatalog: true, NOT: { id: playlistId } },
      data: { isMainCatalog: false },
    }),
    prisma.playlist.update({
      where: { id: playlistId },
      data: { isMainCatalog: true },
    }),
  ]);
}

export async function getMainCatalogPlaylist() {
  const selected = await prisma.playlist.findFirst({
    where: { isMainCatalog: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      publicId: true,
      slug: true,
      name: true,
      description: true,
      visibility: true,
      status: true,
      ownerUserId: true,
      isAutoAllTracks: true,
    },
  });
  if (selected) return selected;

  return prisma.playlist.findFirst({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      publicId: true,
      slug: true,
      name: true,
      description: true,
      visibility: true,
      status: true,
      ownerUserId: true,
      isAutoAllTracks: true,
    },
  });
}
