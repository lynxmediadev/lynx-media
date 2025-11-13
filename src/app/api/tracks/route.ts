/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/api/tracks/route.ts                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace (peras y manzanas)                                                │
 * │ - GET /api/tracks: listado con filtros q/mood/use, order/dir, cursor y     │
 * │   view=list|full; entrega totalCount y fallback suave si falla la BD.      │
 * │ - POST /api/tracks: ahora acepta dos variantes de payload:                  │
 * │     A) { audio: { url: "/audio/demo.mp3" } }                                │
 * │     B) { audioUrl: "/audio/demo.mp3" }                                      │
 * │   y permite rutas relativas ("/audio/…") **o** URLs absolutas.              │
 * │   Normaliza a `audioUrl` y crea el Track en Prisma.                         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, type Prisma } from "@prisma/client";
import { z } from "zod";

// ───────────────────────────────────────────────────────────────────────────────
// Prisma Client (singleton en dev)
// ───────────────────────────────────────────────────────────────────────────────
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["error","warn"],
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Forzamos dinámico en App Router
export const dynamic = "force-dynamic";

// ───────────────────────────────────────────────────────────────────────────────
// Helpers de querystring para GET
// ───────────────────────────────────────────────────────────────────────────────
function getStringArray(sp: URLSearchParams, key: string): string[] {
  const values = sp.getAll(key).flatMap((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return [...new Set(values)];
}
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
function parseLimit(sp: URLSearchParams): number {
  const raw = sp.get("limit");
  if (!raw) return 20;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return 20;
  return clamp(parsed, 1, 100);
}
function parseOrder(sp: URLSearchParams): Prisma.SortOrder {
  const dir = sp.get("dir") ?? "desc";
  return dir === "asc" ? "asc" : "desc";
}
function parseOrderField(
  sp: URLSearchParams,
): "createdAt" | "title" | "artist" {
  const order = sp.get("order") ?? "createdAt";
  return order === "title" || order === "artist" ? order : "createdAt";
}
function parseView(sp: URLSearchParams): "list" | "full" {
  const v = sp.get("view") ?? "list";
  return v === "full" ? "full" : "list";
}

// ───────────────────────────────────────────────────────────────────────────────
// Validación tolerante de URL/Path (acepta absoluta o relativa)
// ───────────────────────────────────────────────────────────────────────────────
const urlOrPath = z
  .string()
  .min(1)
  .refine(
    (s) =>
      /^https?:\/\//i.test(s) || s.startsWith("/"),
    'Debe ser URL absoluta ("https://…") o ruta relativa que empiece con "/"',
  );

// Schema combinado: acepta audioUrl plano o audio.url anidado
const incomingTrackSchema = z
  .object({
    title: z.string().min(1, "title es requerido"),
    artist: z.string().optional().nullable(),
    audioUrl: urlOrPath.optional(), // variante B
    audio: z
      .object({
        url: urlOrPath,
      })
      .optional(), // variante A
    coverUrl: urlOrPath.optional().nullable(),
    moods: z.array(z.string()).optional().default([]),
    uses: z.array(z.string()).optional().default([]),
    durationSec: z.number().int().positive().optional(),
    restrictions: z.array(z.string()).optional().default([]),
    waveform: z.any().optional(),
  })
  .refine(
    (v) => Boolean(v.audioUrl ?? v.audio?.url),
    {
      message: "Debes enviar audioUrl o audio.url",
      path: ["audioUrl"],
    },
  );

// Normalización a shape único para Prisma
function normalizeIncoming(input: z.infer<typeof incomingTrackSchema>) {
  const audioUrl = input.audioUrl ?? input.audio?.url ?? null;
  return {
    title: input.title,
    artist: input.artist ?? null,
    audioUrl, // ← columna real en DB
    coverUrl: input.coverUrl ?? null,
    moods: input.moods ?? [],
    uses: input.uses ?? [],
    durationSec: input.durationSec ?? null,
    restrictions: input.restrictions ?? [],
    waveform: input.waveform ?? null,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/tracks
// ───────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = sp.get("q")?.trim() || "";
  const moods = getStringArray(sp, "mood");
  const uses = getStringArray(sp, "use");
  const limit = parseLimit(sp);
  const cursor = sp.get("cursor") ?? null;

  const orderField = parseOrderField(sp);
  const orderDir = parseOrder(sp);
  const view = parseView(sp);

  const where: Prisma.TrackWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { artist: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      moods.length ? { moods: { hasSome: moods } } : {},
      uses.length ? { uses: { hasSome: uses } } : {},
    ],
  };

  const primaryOrder: Prisma.TrackOrderByWithRelationInput =
    orderField === "createdAt"
      ? { createdAt: orderDir }
      : orderField === "title"
      ? { title: orderDir }
      : { artist: orderDir };

  const orderBy: Prisma.TrackOrderByWithRelationInput[] = [
    primaryOrder,
    { id: "asc" }, // tie-breaker estable
  ];

  const SELECT_LIST = {
    id: true,
    title: true,
    artist: true,
    coverUrl: true,
    moods: true,
    uses: true,
  } satisfies Prisma.TrackSelect;

  const select = view === "list" ? SELECT_LIST : undefined;

  try {
    const [totalCount, rows] = await Promise.all([
      prisma.track.count({ where }),
      prisma.track.findMany({
        where,
        orderBy,
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        ...(select ? { select } : {}),
      }),
    ]);

    let nextCursor: string | null = null;
    let items = rows;
    if (rows.length > limit) {
      nextCursor = (rows[rows.length - 1] as { id: string }).id;
      items = rows.slice(0, limit);
    }

    if (view === "list") {
      // Si tienes un schema de salida, valídalo aquí. Si no, respondemos directo.
      // (Omitido para mantener foco en el POST)
    }

    return NextResponse.json(
      { items, nextCursor, totalCount },
      { status: 200 },
    );
  } catch (err) {
    console.error("GET /api/tracks error:", err);
    return NextResponse.json(
      buildFallback("Fallo de base de datos o configuración; mostrando datos de ejemplo."),
      { status: 200 },
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
/** POST /api/tracks — Acepta:
 *  A) {
 *       "title": "epicooooo",
 *       "artist": "dsiuyfiuoyfds",
 *       "audio": { "url": "/audio/demo.mp3" },
 *       "coverUrl": "/images/hero/hero-bg-1.png",
 *       "moods": ["Epic","Emotional","Elegant"],
 *       "uses":  ["TV","Cine","Publicidad"]
 *     }
 *  B) {
 *       "title": "epicooooo",
 *       "artist": "dsiuyfiuoyfds",
 *       "audioUrl": "/audio/demo.mp3",
 *       "coverUrl": "/images/hero/hero-bg-1.png",
 *       "moods": ["Epic","Emotional","Elegant"],
 *       "uses":  ["TV","Cine","Publicidad"]
 *     }
 */
// ───────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    const parsed = incomingTrackSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.flatten(),
          examples: {
            variantA: {
              title: "Track Title",
              artist: "Artist",
              audio: { url: "/audio/demo.mp3" },
              coverUrl: "/images/cover.png",
              moods: ["Epic"],
              uses: ["TV"],
            },
            variantB: {
              title: "Track Title",
              artist: "Artist",
              audioUrl: "/audio/demo.mp3",
              coverUrl: "/images/cover.png",
              moods: ["Epic"],
              uses: ["TV"],
            },
          },
        },
        { status: 400 },
      );
    }

    const data = normalizeIncoming(parsed.data);

    // Si quieres **exigir** audioUrl no nulo, valida aquí:
    if (!data.audioUrl) {
      return NextResponse.json(
        { error: "audioUrl es requerido (o audio.url)" },
        { status: 400 },
      );
    }

    const created = await prisma.track.create({
      data: {
        title: data.title,
        artist: data.artist,
        audioUrl: data.audioUrl,
        coverUrl: data.coverUrl,
        moods: data.moods,
        uses: data.uses,
        durationSec: data.durationSec ?? undefined,
        restrictions: data.restrictions,
        waveform: data.waveform as any,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tracks error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Fallback de demostración para GET
// ───────────────────────────────────────────────────────────────────────────────
function buildFallback(warning: string) {
  return {
    items: [
      {
        id: "demo-001",
        title: "Demo Epic Orchestral",
        artist: "Lynx Music Collective",
        coverUrl: "/images/hero/hero-bg-1.png",
        moods: ["Epic", "Emotional", "Elegant"],
        uses: ["TV", "Cine", "Publicidad"],
      },
      {
        id: "demo-002",
        title: "Urban Night Drive",
        artist: "Lynx Music Collective",
        coverUrl: "/images/hero/hero-bg-2.png",
        moods: ["Dark", "Stylish"],
        uses: ["Publicidad", "Fashion"],
      },
    ],
    nextCursor: null,
    totalCount: 2,
    warning,
  };
}
