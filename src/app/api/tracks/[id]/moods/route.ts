import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { slugify } from "@/lib/slugify";
import { TagType } from "@prisma/client";
import { syncTrackTagsByType } from "@/server/tags/syncTrackTagsByType";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";

const schema = z.object({ moods: z.array(z.string().min(1)).max(10) });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = await params;
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await canAccessTrackByRole(user, trackId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tags = await db.trackTag.findMany({
    where: { trackId, tag: { type: TagType.MOOD } },
    select: { tag: { select: { name: true, slug: true } } },
    orderBy: { assignedAt: "asc" },
  });
  const items = tags.map((t) => ({
    name: t.tag.name,
    slug: t.tag.slug,
    type: "MOOD",
  }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = await params;
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await canAccessTrackByRole(user, trackId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const track = await db.track.findUnique({ where: { id: trackId }, select: { id: true } });
  if (!track) {
    return NextResponse.json({ error: "Track no encontrado" }, { status: 404 });
  }

  const moodNames = Array.from(new Set(parsed.data.moods.map((m) => m.toUpperCase())));
  const saved = await syncTrackTagsByType({
    trackId,
    type: TagType.MOOD,
    inputs: moodNames.map((name) => ({ slug: slugify(name), name })),
  });

  return NextResponse.json({
    ok: true,
    items: saved.map((t) => ({ id: t.id, name: t.name, slug: t.slug, type: "MOOD" })),
  });
}
