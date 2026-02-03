import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slugify";

const schema = z.object({ moods: z.array(z.string().min(1)).max(10) });

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

  const moodNames = parsed.data.moods.map((m) => m.toUpperCase());

  // upsert missing moods
  const found = await db.mood.findMany({ where: { name: { in: moodNames, mode: "insensitive" } }, select: { name: true } });
  const foundSet = new Set(found.map((m) => m.name.toLowerCase()));
  const missing = moodNames.filter((m) => !foundSet.has(m.toLowerCase()));

  for (const name of missing) {
    await db.mood.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
  }

  const moodRecords = await db.mood.findMany({ where: { name: { in: moodNames, mode: "insensitive" } }, select: { id: true, name: true } });
  const moodIds = moodRecords.map((m) => m.id);

  await db.$transaction(async (tx) => {
    await tx.track.update({ where: { id: trackId }, data: { moods: moodNames } });
    await tx.trackMood.deleteMany({ where: { trackId } });
    if (moodIds.length > 0) {
      await tx.trackMood.createMany({ data: moodIds.map((moodId) => ({ trackId, moodId })) });
    }
  });

  revalidatePath(`/admin/track/${trackId}/edit`);
  return NextResponse.json({ ok: true });
}
