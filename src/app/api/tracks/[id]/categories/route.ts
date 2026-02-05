import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { TagType } from "@prisma/client";
import { revalidatePath } from "next/cache";

const bodySchema = z.object({
  slugs: z.array(z.string()).default([]),
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const slugs = Array.from(
    new Set(
      parsed.data.slugs
        .map((s) => s?.toString().trim())
        .filter(Boolean)
        .map(slugify)
        .filter(Boolean),
    ),
  );

  try {
    console.log("[POST /api/tracks/:id/categories] incoming", { id, slugs });
    await db.$transaction(async (tx) => {
      // Asegura que todos los slugs existan como Tag CATALOG (si estaban como GENERIC, se promueven)
      for (const slug of slugs) {
        await tx.tag.upsert({
          where: { slug },
          update: { type: TagType.CATALOG, name: slug.toUpperCase() },
          create: { slug, name: slug.toUpperCase(), type: TagType.CATALOG },
        });
      }

      // Releer todos los tags finales
      const tags = await tx.tag.findMany({
        where: { type: TagType.CATALOG, slug: { in: slugs } },
        select: { id: true, slug: true, name: true },
      });

      // Reemplazar pivote
      await tx.trackTag.deleteMany({
        where: {
          trackId: id,
          tag: { type: TagType.CATALOG },
        },
      });
      if (tags.length) {
        await tx.trackTag.createMany({
          data: tags.map((tag) => ({ trackId: id, tagId: tag.id })),
          skipDuplicates: true, // evita P2002 si llega doble petición o tags repetidos
        });
      }
    });

    const assigned = await db.trackTag.findMany({
      where: { trackId: id, tag: { type: TagType.CATALOG } },
      select: { tag: { select: { id: true, slug: true, name: true } } },
      orderBy: { assignedAt: "asc" },
    });

    console.log("[POST /api/tracks/:id/categories] saved", {
      trackId: id,
      assigned: assigned.map((r) => r.tag.slug),
    });
    revalidatePath(`/admin/track/${id}/edit`);

    return NextResponse.json({
      ok: true,
      slugs,
      items: assigned.map((r) => ({
        id: r.tag.id,
        slug: r.tag.slug,
        name: r.tag.name,
      })),
    });
  } catch (err) {
    console.error("[POST /api/tracks/:id/categories] error", err);
    return NextResponse.json({ ok: false, error: "Error al guardar categorías" }, { status: 500 });
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rows = await db.trackTag.findMany({
      where: { trackId: id, tag: { type: TagType.CATALOG } },
      select: { tag: { select: { id: true, slug: true, name: true } } },
      orderBy: { assignedAt: "asc" },
    });
    const items = rows.map((r) => ({
      id: r.tag.id,
      slug: r.tag.slug,
      name: r.tag.name,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/tracks/:id/categories] error", err);
    return NextResponse.json({ error: "Error al leer categorías" }, { status: 500 });
  }
}
