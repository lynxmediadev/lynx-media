// src/app/api/tracks/route.ts
/**
 * API de Tracks (App Router)
 *
 * Ruta:
 *   - POST /api/tracks  → crear track a partir de un payload JSON
 *   - GET  /api/tracks  → listar tracks (uso general/admin)
 *
 * Peras y manzanas:
 * - POST se usa desde el flujo de ingest (AdminTrackIngestPage):
 *     • Recibe título, artista, audioUrl (via `audio.url`),
 *       moods, uses, coverUrl.
 *     • AHORA también recibe:
 *         - assetKey: clave interna del objeto en R2/S3
 *         - assetMime: MIME del archivo subido (ej: audio/wav)
 *         - assetSize: tamaño en bytes
 * - Guardamos esos campos en la tabla Track para poder:
 *     • Construir URLs públicas (getS3PublicUrl) cuando haga falta.
 *     • Borrar físicamente el asset en R2 usando assetKey.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

/**
 * Schema del payload entrante para crear track.
 *
 * NOTA:
 * - `audio.url` representa la URL pública del audio (R2 u otra).
 * - `assetKey` / `assetMime` / `assetSize` son opcionales, pero cuando
 *   el audio viene de R2 es MUY recomendable enviarlos.
 */
const incomingTrackSchema = z.object({
  title: z.string().min(1, "El Título es obligatorio"),
  artist: z.string().min(1, "El Artista es obligatorio"),

  audio: z
    .object({
      url: z.string().url().optional().nullable(),
    })
    .optional()
    .nullable(),

  coverUrl: z.string().url().optional().nullable(),

  moods: z.array(z.string()).optional(),
  uses: z.array(z.string()).optional(),

  durationSec: z.number().optional(),
  restrictions: z.array(z.string()).optional(),

  // Opcional: waveform base64 (no lo usas hoy en ingest, pero lo dejamos)
  waveform: z.string().optional(),

  // NUEVO: metadatos del asset en R2/S3
  assetKey: z.string().optional(),
  assetMime: z.string().optional(),
  assetSize: z.number().int().nonnegative().optional(),
});

/**
 * Normaliza el payload de entrada a algo que Prisma entienda bien.
 */
function normalizeIncoming(input: z.infer<typeof incomingTrackSchema>) {
  const title = input.title.trim();
  const artist = input.artist.trim();

  const audioUrl = input.audio?.url?.toString().trim() || null;

  const coverUrl = (input.coverUrl ?? "").toString().trim() || null;

  const moods = (input.moods ?? []).map((m) => m.trim()).filter(Boolean);
  const uses = (input.uses ?? []).map((u) => u.trim()).filter(Boolean);

  const durationSec =
    typeof input.durationSec === "number" ? input.durationSec : null;

  const restrictions = (input.restrictions ?? [])
    .map((r) => r.trim())
    .filter(Boolean);

  // Waveform opcional en base64 → Buffer
  let waveform: Buffer | null = null;
  if (input.waveform && input.waveform.trim().length > 0) {
    try {
      waveform = Buffer.from(input.waveform.trim(), "base64");
    } catch (err) {
      console.warn(
        "[api/tracks] waveform base64 inválido; se ignora el campo.",
        err,
      );
    }
  }

  // NUEVO: metadatos de asset en R2/S3
  const assetKey = (input.assetKey ?? "").toString().trim() || "";

  const assetMime = (input.assetMime ?? "").toString().trim() || "";

  const assetSize =
    typeof input.assetSize === "number" && input.assetSize >= 0
      ? input.assetSize
      : 0;

  return {
    title,
    artist,
    audioUrl,
    coverUrl,
    moods,
    uses,
    durationSec,
    restrictions,
    waveform,
    assetKey,
    assetMime,
    assetSize,
  };
}

/**
 * POST /api/tracks
 * Crea un track nuevo.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = incomingTrackSchema.safeParse(json);

    if (!parsed.success) {
      console.error("[api/tracks:POST] payload inválido:", parsed.error);
      return NextResponse.json(
        {
          ok: false,
          error: "Payload inválido",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = normalizeIncoming(parsed.data);

    const created = await db.track.create({
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

        // NUEVO: metadatos del asset en R2
        assetKey: data.assetKey,
        assetMime: data.assetMime,
        assetSize: data.assetSize,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        track: {
          id: created.id,
          title: created.title,
          artist: created.artist,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/tracks:POST] error inesperado:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al crear track" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/tracks
 * Listado simple de tracks (puede servir para debugging o vistas futuras).
 */
export async function GET() {
  try {
    const tracks = await db.track.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, tracks });
  } catch (err) {
    console.error("[api/tracks:GET] error inesperado:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al listar tracks" },
      { status: 500 },
    );
  }
}
