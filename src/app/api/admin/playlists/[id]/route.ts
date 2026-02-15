import { NextRequest, NextResponse } from "next/server";
import { PlaylistStatus, PlaylistVisibility } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function canManageAdminModules(role: "ADMIN" | "STAFF" | "CREATOR") {
  return role === "ADMIN" || role === "STAFF";
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.nativeEnum(PlaylistStatus).optional(),
  visibility: z.nativeEnum(PlaylistVisibility).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.visibility !== undefined ? { visibility: parsed.data.visibility } : {}),
      ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      visibility: true,
      featured: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.playlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
