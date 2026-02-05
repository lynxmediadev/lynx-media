import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { TagType } from "@prisma/client";
import { slugify } from "@/lib/slugify";

const schema = z.object({ uses: z.array(z.string().min(1)).max(30) });

const toUpper = (txt: string) => {
  const clean = txt.trim();
  if (!clean) return "";
  return clean.toUpperCase();
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = await params;
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { uses: true },
  });
  if (!track) return NextResponse.json({ error: "Track no encontrado" }, { status: 404 });
  const uses = (track.uses ?? []).map(toUpper);
  return NextResponse.json({
    items: uses.map((u) => ({ name: u, slug: slugify(u), type: "USE" })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const uses = Array.from(new Set(parsed.data.uses.map(toUpper)));

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
  return NextResponse.json({
    ok: true,
    items: uses.map((u) => ({ name: u, slug: slugify(u), type: "USE" })),
  });
}
