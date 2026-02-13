import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { TagType } from "@prisma/client";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
});

const defaultCategories = [
  "POP",
  "ROCK",
  "ELECTRONIC",
  "HIP HOP",
  "AMBIENT",
  "CLASSICAL",
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

// Levenshtein con límite pequeño para detectar duplicados cercanos (ej. "Tele" vs "Telo")
function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const above = dp[i - 1]![j]!;
      const left = dp[i]![j - 1]!;
      const diag = dp[i - 1]![j - 1]!;
      dp[i]![j] = Math.min(above + 1, left + 1, diag + cost);
    }
  }
  return dp[m]![n]!;
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
    select: { id: true, name: true, slug: true, type: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      name: i.name.toUpperCase(),
      slug: i.slug,
      type: i.type,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await getRequestAuthUser(req);
  if (!auth || (auth.role !== "ADMIN" && auth.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const upper = name.toUpperCase();
  const slug = slugify(upper);
  if (!slug) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });

  const existing = await db.tag.findFirst({
    where: {
      type: TagType.CATALOG,
      OR: [
        { slug },
        { name: { equals: upper, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, slug: true, type: true },
  });

  if (existing) {
    return NextResponse.json({ error: "Categoría ya existe", suggestions: [existing] }, { status: 409 });
  }

  // Buscar similares (distancia <=1)
  const nearby = await db.tag.findMany({
    where: {
      type: TagType.CATALOG,
      name: { startsWith: upper.slice(0, 3), mode: "insensitive" },
    },
    select: { id: true, name: true, slug: true, type: true },
    take: 15,
  });
  const similar = nearby.filter((c) => distance(c.name.toLowerCase(), upper.toLowerCase()) <= 1);
  if (similar.length) {
    return NextResponse.json(
      { error: "Existe una categoría muy parecida", suggestions: similar },
      { status: 409 },
    );
  }

  const item = await db.tag.create({ data: { name: upper, slug, type: TagType.CATALOG } });

  return NextResponse.json({ item: { ...item, name: upper } }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await getRequestAuthUser(req);
  if (!auth || (auth.role !== "ADMIN" && auth.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" && body.id.trim().length ? body.id.trim() : null;
  const slugRaw = typeof body.slug === "string" && body.slug.trim().length ? body.slug.trim() : null;
  const slug = slugRaw ? slugify(slugRaw) : null;

  if (!id && !slug) {
    return NextResponse.json({ error: "ID o slug requerido" }, { status: 400 });
  }

  // Si vienen ambos, aceptamos coincidencia por cualquiera de los dos.
  const tag = await db.tag.findFirst({
    where: {
      type: TagType.CATALOG,
      OR: [
        ...(id ? [{ id }] : []),
        ...(slug ? [{ slug }] : []),
      ],
    },
  });

  if (!tag) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  // Limpia pivote TrackTag antes de borrar
  await db.trackTag.deleteMany({ where: { tagId: tag.id } });
  await db.tag.delete({ where: { id: tag.id } });

  return NextResponse.json({ ok: true });
}
