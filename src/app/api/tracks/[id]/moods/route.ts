import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slugify";
import { TagType } from "@prisma/client";

const schema = z.object({ moods: z.array(z.string().min(1)).max(10) });

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = await params;
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = await params;
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

  for (const name of moodNames) {
    const slug = slugify(name);
    await db.tag.upsert({
      where: { slug },
      update: { name, type: TagType.MOOD },
      create: { slug, name, type: TagType.MOOD },
    });
  }

  const tags = await db.tag.findMany({
    where: { slug: { in: moodNames.map(slugify) }, type: TagType.MOOD },
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    await tx.trackTag.deleteMany({ where: { trackId, tag: { type: TagType.MOOD } } });
    if (tags.length) {
      await tx.trackTag.createMany({
        data: tags.map((t) => ({ trackId, tagId: t.id })),
        skipDuplicates: true,
      });
    }
  });

  const saved = await db.tag.findMany({
    where: { id: { in: tags.map((t) => t.id) } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  revalidatePath(`/admin/track/${trackId}/edit`);
  return NextResponse.json({
    ok: true,
    items: saved.map((t) => ({ id: t.id, name: t.name, slug: t.slug, type: "MOOD" })),
  });
}
