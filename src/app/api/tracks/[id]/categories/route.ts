import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { TagType } from "@prisma/client";
import { syncTrackTagsByType } from "@/server/tags/syncTrackTagsByType";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";

const bodySchema = z.object({
  slugs: z.array(z.string()).default([]),
});

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function labelFromSlug(slug: string) {
  return slug.replace(/-/g, " ").toUpperCase();
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await canAccessTrackByRole(user, id);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const slugs = Array.from(
    new Set(
      parsed.data.slugs
        .map((s) => s?.toString().trim())
        .filter(Boolean)
        .map(slugify)
        .filter(Boolean),
    ),
  );

  try {
    const track = await db.track.findUnique({ where: { id }, select: { id: true } });
    if (!track) {
      return NextResponse.json({ ok: false, error: "Track no encontrado" }, { status: 404 });
    }

    const existingTags = await db.tag.findMany({
      where: { slug: { in: slugs }, type: TagType.CATALOG },
      select: { slug: true, name: true },
    });
    const existingBySlug = new Map(existingTags.map((tag) => [tag.slug, tag.name]));

    const assigned = await syncTrackTagsByType({
      trackId: id,
      type: TagType.CATALOG,
      inputs: slugs.map((slug) => ({
        slug,
        name: existingBySlug.get(slug) ?? labelFromSlug(slug),
      })),
    });

    return NextResponse.json({
      ok: true,
      slugs,
      items: assigned.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
      })),
    });
  } catch (err) {
    console.error("[POST /api/tracks/:id/categories] error", err);
    return NextResponse.json({ ok: false, error: "Error al guardar categorías" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await canAccessTrackByRole(user, id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await db.trackTag.findMany({
      where: { trackId: id, tag: { type: TagType.CATALOG } },
      select: { tag: { select: { id: true, slug: true, name: true } } },
      orderBy: { assignedAt: "asc" },
    });
    const items = rows.map((r) => ({
      id: r.tag.id,
      slug: r.tag.slug,
      name: r.tag.name,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/tracks/:id/categories] error", err);
    return NextResponse.json({ error: "Error al leer categorías" }, { status: 500 });
  }
}
