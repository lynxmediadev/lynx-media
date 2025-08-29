/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: API Tracks (GET listado con orden/totalCount/proyección + POST)    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - GET /api/tracks                                                          │
 * │   • Filtros: q (title/artist), mood[], use[]                               │
 * │   • Orden:  order=createdAt|title|artist, dir=asc|desc                     │
 * │   • Paginación por cursor: cursor=<id>, limit (1..100, default 20)         │
 * │   • Proyección: view=list (mínimo) | view=full (modelo completo)           │
 * │   • totalCount del resultado filtrado (ignora el cursor).                  │
 * │   • Fallback seguro si la BD falla (no rompe la UI).                       │
 * │ - POST /api/tracks                                                         │
 * │   • Valida con trackCreateSchema y retorna 201 { id }.                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Si necesitas listas rápidas para la grilla: usa view=list (default).     │
 * │ - Si abres una ficha/detalle: usa view=full para traer todos los campos.   │
 * │ - totalCount sirve para paginadores y “X resultados encontrados”.           │
 * │ - order/dir ordenan el conjunto; el cursor avanza la página siguiente.     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
[
  {
    "AllowedOrigins": [
      "http://localhost:3000", 
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": [
      "POST", 
      "GET", 
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]


import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, type Prisma } from "@prisma/client";
import { z } from "zod";

// Reutilizamos tus schemas existentes del proyecto:
import { trackCreateSchema } from "@/schema/track";

// Nuevos schemas auxiliares de B3:
import {
  orderDirSchema,
  orderFieldSchema,
  trackViewSchema,
  tracksListResponseSchema,
  type TrackView,
} from "@/schema/tracks.list";

// ───────────────────────────────────────────────────────────────────────────────
// Prisma Client (singleton seguro en dev para evitar demasiadas conexiones)
// ───────────────────────────────────────────────────────────────────────────────
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Puedes ajustar logs si te sirven para debug:
    // log: ["error", "warn"],
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Forzamos dinámico (lista debe reflejar DB actual).
export const dynamic = "force-dynamic";

// ───────────────────────────────────────────────────────────────────────────────
// Utilidades de parseo de querystring (múltiples formatos)
// ───────────────────────────────────────────────────────────────────────────────
function getStringArray(sp: URLSearchParams, key: string): string[] {
  // Admite ?mood=A,B,C y también ?mood=A&mood=B
  const values = sp.getAll(key).flatMap((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  // Dedupe conservando orden
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
  const parsed = orderDirSchema.safeParse(dir);
  return parsed.success ? (parsed.data as Prisma.SortOrder) : "desc";
}

function parseOrderField(sp: URLSearchParams): "createdAt" | "title" | "artist" {
  const order = sp.get("order") ?? "createdAt";
  const parsed = orderFieldSchema.safeParse(order);
  return parsed.success ? parsed.data : "createdAt";
}

function parseView(sp: URLSearchParams): TrackView {
  const view = sp.get("view") ?? "list";
  const parsed = trackViewSchema.safeParse(view);
  return parsed.success ? parsed.data : "list";
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

  const orderField = parseOrderField(sp); // createdAt | title | artist
  const orderDir = parseOrder(sp); // asc | desc
  const view = parseView(sp); // list | full

  // Construimos el filtro Prisma (solo se agregan cláusulas si hay valores)
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

  // Orden estable con tie-breaker por id para paginar de forma determinista
  const primaryOrder: Prisma.TrackOrderByWithRelationInput =
    orderField === "createdAt"
      ? { createdAt: orderDir }
      : orderField === "title"
      ? { title: orderDir }
      : { artist: orderDir };

  const orderBy: Prisma.TrackOrderByWithRelationInput[] = [
    primaryOrder,
    { id: "asc" }, // desempate estable
  ];

  // Proyección: en list devolvemos un subconjunto mínimo
  const SELECT_LIST = {
    id: true,
    title: true,
    artist: true,
    coverUrl: true,
    moods: true,
    uses: true,
  } satisfies Prisma.TrackSelect;

  const select = view === "list" ? SELECT_LIST : undefined; // undefined = objeto completo

  try {
    // totalCount ignora cursor (sirve para paginador y resumen UI)
    const totalCountPromise = prisma.track.count({ where });

    // findMany con "limit + 1" para detectar si hay página siguiente
    const itemsPromise = prisma.track.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      ...(select ? { select } : {}), // en full no aplicamos select
    });

    const [totalCount, rows] = await Promise.all([totalCountPromise, itemsPromise]);

    // Calcular nextCursor y recortar al "limit"
    let nextCursor: string | null = null;
    let items = rows;
    if (rows.length > limit) {
      const nextItem = rows[rows.length - 1] as { id: string };
      nextCursor = nextItem.id;
      items = rows.slice(0, limit);
    }

    // Validación de salida si estamos en "list" (defensa ante cambios de modelo)
    if (view === "list") {
      const validation = tracksListResponseSchema.safeParse({
        items,
        nextCursor,
        totalCount,
      });
      if (!validation.success) {
        // Si la validación falla, devolvemos fallback suave para no romper la UI
        console.error("DTO validation failed (list view):", validation.error.format());
        return NextResponse.json(
          buildFallback("La respuesta no pasó validación (list view)."),
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      {
        items,
        nextCursor,
        totalCount,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/tracks error:", err);
    // Fallback seguro: no rompe UI aunque la BD falle
    return NextResponse.json(
      buildFallback("Fallo de base de datos o configuración; mostrando datos de ejemplo."),
      { status: 200 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/tracks  (se mantiene compatible con B1/B2)
// ───────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = trackCreateSchema.parse(data);

    const created = await prisma.track.create({
      data: {
        title: parsed.title,
        artist: parsed.artist,
        // 👇 mapeo importante: en BD la columna es audioUrl
        audioUrl: parsed.audio.url,
        // opcionales con defaults seguros
        coverUrl: parsed.coverUrl ?? null,
        moods: parsed.moods ?? [],
        uses: parsed.uses ?? [],
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err: any) {
    // Respuesta clara si falló Zod
    if (err?.issues) {
      return NextResponse.json(
        { error: "Invalid payload", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/tracks error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// ───────────────────────────────────────────────────────────────────────────────
// Fallback de demostración (no romper UI)
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
