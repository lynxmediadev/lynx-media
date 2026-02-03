import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { TagType } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
});

const defaultCategories = [
  "Pop",
  "Rock",
  "Electronic",
  "Hip Hop",
  "Ambient",
  "Classical",
];

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
  const count = await db.tag.count({ where: { type: TagType.CATALOG } });
  if (count > 0) return;
  await db.tag.createMany({
    data: defaultCategories.map((name) => ({ name, slug: slugify(name), type: TagType.CATALOG })),
    skipDuplicates: true,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";

  await ensureSeeds();

  const where = {
    type: TagType.CATALOG,
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

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const title = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  const slug = slugify(title);
  if (!slug) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });

  const existing = await db.tag.findFirst({
    where: {
      type: TagType.CATALOG,
      OR: [
        { slug },
        { name: { equals: title, mode: "insensitive" } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Categoría ya existe", suggestions: [existing] }, { status: 409 });
  }

  const item = await db.tag.create({ data: { name: title, slug, type: TagType.CATALOG } });

  return NextResponse.json({ item }, { status: 201 });
}
