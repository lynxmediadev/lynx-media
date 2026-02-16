import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { PlaylistStatus, PlaylistVisibility, Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import {
  canRoleManageAnyPlaylists,
  canRoleManageOwnPlaylists,
  generateUniquePlaylistPublicId,
} from "@/lib/playlists/service";

function canManagePlaylists(role: UserRole) {
  return canRoleManageAnyPlaylists(role) || canRoleManageOwnPlaylists(role);
}

function parseIntSafe(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.nativeEnum(PlaylistStatus).optional(),
  visibility: z.nativeEnum(PlaylistVisibility).optional(),
  embedEnabled: z.boolean().optional(),
  isMainCatalog: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManagePlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const statusRaw = (req.nextUrl.searchParams.get("status") ?? "").trim().toUpperCase();
  const visibilityRaw = (req.nextUrl.searchParams.get("visibility") ?? "").trim().toUpperCase();
  const page = parseIntSafe(req.nextUrl.searchParams.get("page"), 1, 1, 999);
  const per = parseIntSafe(req.nextUrl.searchParams.get("per"), 20, 1, 100);

  const status = Object.values(PlaylistStatus).includes(statusRaw as PlaylistStatus)
    ? (statusRaw as PlaylistStatus)
    : undefined;
  const visibility = Object.values(PlaylistVisibility).includes(visibilityRaw as PlaylistVisibility)
    ? (visibilityRaw as PlaylistVisibility)
    : undefined;

  const whereAND: Prisma.PlaylistWhereInput[] = [];
  if (q) {
    whereAND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (status) whereAND.push({ status });
  if (visibility) whereAND.push({ visibility });
  if (!canRoleManageAnyPlaylists(user.role)) {
    whereAND.push({ ownerUserId: user.id });
  }

  const where: Prisma.PlaylistWhereInput = whereAND.length ? { AND: whereAND } : {};
  const skip = (page - 1) * per;

  const [items, total] = await Promise.all([
    prisma.playlist.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        visibility: true,
        featured: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tracks: true,
          },
        },
      },
    }),
    prisma.playlist.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    page,
    per,
    total,
    items: items.map((item) => ({
      ...item,
      trackCount: item._count.tracks,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManagePlaylists(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const canSetMainCatalog = user.role === "ADMIN" && parsed.data.isMainCatalog === true;
  const playlist = await prisma.$transaction(async (tx) => {
    const created = await tx.playlist.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        publicId: await generateUniquePlaylistPublicId(tx),
        description: parsed.data.description || null,
        status: parsed.data.status ?? "DRAFT",
        visibility: parsed.data.visibility ?? "INTERNAL",
        embedEnabled: parsed.data.embedEnabled ?? true,
        isMainCatalog: canSetMainCatalog,
        featured: parsed.data.featured ?? false,
        sortOrder: parsed.data.sortOrder ?? 0,
        ownerUserId: user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        publicId: true,
        status: true,
        visibility: true,
        embedEnabled: true,
        isMainCatalog: true,
        featured: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (canSetMainCatalog) {
      await tx.playlist.updateMany({
        where: { isMainCatalog: true, NOT: { id: created.id } },
        data: { isMainCatalog: false },
      });
      await tx.playlist.update({
        where: { id: created.id },
        data: { isMainCatalog: true },
      });
    }
    return created;
  });

  revalidatePath("/admin/playlists");
  revalidatePath(`/admin/playlists/${playlist.id}`);
  revalidatePath("/creator/playlists");
  revalidatePath(`/creator/playlists/${playlist.id}`);
  revalidatePath(`/playlist/${playlist.publicId}`);
  if (canSetMainCatalog) {
    revalidatePath("/catalog");
  }

  return NextResponse.json({ ok: true, item: playlist }, { status: 201 });
}
