import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { TagType } from "@prisma/client";
import { slugify } from "@/lib/slugify";

const schema = z.object({ uses: z.array(z.string().min(1)).max(30) });

function toTitleCase(txt: string) {
  const clean = txt.trim();
  if (!clean) return "";
  if (clean.length <= 3) return clean.toUpperCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const uses = parsed.data.uses.map(toTitleCase);

  const track = await db.track.findUnique({ where: { id: trackId }, select: { id: true } });
  if (!track) {
    return NextResponse.json({ error: "Track no encontrado" }, { status: 404 });
  }

  // Upsert catálogo de usos para que los recién creados persistan y aparezcan en sugeridos
  for (const name of uses) {
    const slug = slugify(name);
    await db.tag.upsert({
      where: { slug },
      update: { name, type: TagType.GENERIC },
      create: { name, slug, type: TagType.GENERIC },
    });
  }

  await db.track.update({
    where: { id: trackId },
    data: { uses },
  });

  revalidatePath(`/admin/track/${trackId}/edit`);
  return NextResponse.json({ ok: true });
}
