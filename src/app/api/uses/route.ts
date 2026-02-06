import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { TagType } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
});

const defaultUses = ["TRAILER", "SERIE", "DOCUMENTAL", "PUBLICIDAD", "VIDEO GAME"];

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

async function ensureSeeds() {
  const count = await db.tag.count({ where: { type: TagType.USE } });
  if (count > 0) return;
  await db.tag.createMany({
    data: defaultUses.map((name) => ({ name, slug: slugify(name), type: TagType.USE })),
    skipDuplicates: true,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";

  await ensureSeeds();

  const where = {
    type: TagType.USE,
    ...(query
      ? {
          name: { contains: query, mode: "insensitive" as const },
        }
      : {}),
  } as const;

  const items = await db.tag.findMany({
    where,
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      type: i.type,
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const normalized = name.toUpperCase();
  const slug = slugify(normalized);
  if (!slug) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });

  const existing = await db.tag.findFirst({
    where: {
      type: TagType.USE,
      OR: [
        { slug },
        { name: { equals: normalized, mode: "insensitive" } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Uso ya existe", suggestions: [existing] }, { status: 409 });
  }

  const item = await db.tag.create({ data: { name: normalized, slug, type: TagType.USE } });

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id as string | undefined;
  const name = (body?.name as string | undefined)?.trim();
  const where = id
    ? { id, type: TagType.USE }
    : name
      ? { name: { equals: name, mode: "insensitive" as const }, type: TagType.USE }
      : null;
  if (!where) {
    return NextResponse.json({ error: "ID o name requerido" }, { status: 400 });
  }

  const deleted = await db.tag.deleteMany({ where });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Uso no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
