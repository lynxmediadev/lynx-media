import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { TagType } from "@prisma/client";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  category: z.string().optional().nullable(),
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

// Levenshtein con límite pequeño para detectar "Happi" vs "Happy"
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";
  const where = query
    ? { name: { contains: query, mode: "insensitive" as const } }
    : {};

  const moods = await db.tag.findMany({
    where: { type: TagType.MOOD, ...where },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json({
    items: moods.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      type: "MOOD",
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
  const nameUpper = name.toUpperCase();
  const slug = slugify(nameUpper);
  if (!slug) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const existing = await db.tag.findFirst({
    where: {
      type: TagType.MOOD,
      OR: [
        { name: { equals: nameUpper, mode: "insensitive" } },
        { slug: { equals: slug, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, slug: true, type: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Mood ya existe", suggestions: [existing] },
      { status: 409 },
    );
  }

  // Buscar similares (edición a distancia <=1)
  const nearby = await db.tag.findMany({
    where: {
      type: TagType.MOOD,
      name: { startsWith: nameUpper.slice(0, 3), mode: "insensitive" },
    },
    select: { id: true, name: true, slug: true, type: true },
    take: 15,
  });
  const similar = nearby.filter((m) => distance(m.name.toLowerCase(), nameUpper.toLowerCase()) <= 1);
  if (similar.length) {
    return NextResponse.json(
      { error: "Existe un mood muy parecido", suggestions: similar },
      { status: 409 },
    );
  }

  const mood = await db.tag.create({
    data: { name: nameUpper, slug, type: TagType.MOOD },
  });

  return NextResponse.json({ item: mood }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await getRequestAuthUser(req);
  if (!auth || (auth.role !== "ADMIN" && auth.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = body?.id as string | undefined;
  const name = (body?.name as string | undefined)?.trim();

  let where: Prisma.TagWhereInput | null = null;
  if (id) {
    where = { id, type: TagType.MOOD };
  } else if (name) {
    where = {
      type: TagType.MOOD,
      name: { equals: name, mode: "insensitive" as const },
    };
  }

  if (!where) {
    return NextResponse.json({ error: "ID o name requerido" }, { status: 400 });
  }

  if (id) {
    await db.trackTag.deleteMany({ where: { tagId: id } });
  } else if (name) {
    await db.trackTag.deleteMany({
      where: {
        tag: {
          type: TagType.MOOD,
          name: { equals: name, mode: "insensitive" as const },
        },
      },
    });
  }

  const deleted = await db.tag.deleteMany({ where });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Mood no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
