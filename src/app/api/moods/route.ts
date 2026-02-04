import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

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

  const moods = await db.mood.findMany({
    where,
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json({ moods });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const nameUpper = name.toUpperCase();
  const category = parsed.data.category?.trim() || null;
  const slug = slugify(nameUpper);
  if (!slug) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const existing = await db.mood.findFirst({
    where: {
      OR: [
        { name: { equals: nameUpper, mode: "insensitive" } },
        { slug: { equals: slug, mode: "insensitive" } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Mood ya existe", suggestions: [existing] },
      { status: 409 },
    );
  }

  // Buscar similares (edición a distancia <=1)
  const nearby = await db.mood.findMany({
    where: { name: { startsWith: nameUpper.slice(0, 3), mode: "insensitive" } },
    take: 15,
  });
  const similar = nearby.filter((m) => distance(m.name.toLowerCase(), nameUpper.toLowerCase()) <= 1);
  if (similar.length) {
    return NextResponse.json(
      { error: "Existe un mood muy parecido", suggestions: similar },
      { status: 409 },
    );
  }

  const mood = await db.mood.create({
    data: { name: nameUpper, slug, category },
  });

  return NextResponse.json({ mood }, { status: 201 });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id as string | undefined;
  const name = (body?.name as string | undefined)?.trim();

  const where = id ? { id } : name ? { name } : null;
  if (!where) {
    return NextResponse.json({ error: "ID o name requerido" }, { status: 400 });
  }

  await db.trackMood.deleteMany({ where: { moodId: id ?? undefined } });
  const deleted = await db.mood.deleteMany({ where });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Mood no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
