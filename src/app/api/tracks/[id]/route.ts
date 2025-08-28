// ================================================
// File: src/app/api/tracks/[id]/route.ts
// Título: API Track por ID con fallback a demo
// Descripción: Intenta BD y, si falla o no existe, retorna un demo.
// Qué hace: Garantiza que /player/api-demo no se rompa.
// Peras y manzanas: “Si no está en la libreta, te muestro la muestra.”
// ================================================
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getTrackById as getDemo } from "@/mocks/track-store";

function mapDb(row: any) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    audioUrl: row.audioUrl,
    coverUrl: row.coverUrl ?? undefined,
    moods: row.moods ?? [],
    uses: row.uses ?? [],
    identifiers: { isrc: row.isrc ?? undefined, iswc: row.iswc ?? undefined, upc: row.upc ?? undefined },
    rights: {
      master: row.master ?? undefined,
      publishingSplit: row.publishingSplit ?? undefined,
      licenseType: row.licenseType ?? undefined,
      territories: row.territories ?? undefined,
      term: row.term ?? undefined,
      mediaBuy: row.mediaBuy ?? undefined,
      mfn: row.mfn ?? undefined,
      restrictions: row.restrictions ?? [],
      contentID: {
        enrolled: row.contentIdEnrolled ?? undefined,
        admin: row.contentIdAdmin ?? undefined,
        whitelist: row.contentIdWhitelist ?? undefined,
      },
    },
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const row = await db.track.findUnique({ where: { id } });
    if (row) return NextResponse.json(mapDb(row), { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[GET /api/tracks/:id] DB error:", e);
  }

  const demo = getDemo(id);
  if (demo) return NextResponse.json(demo, { status: 200, headers: { "Cache-Control": "no-store" } });

  return NextResponse.json({ error: "TRACK_NOT_FOUND", id }, { status: 404 });
}
