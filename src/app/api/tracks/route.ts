// ================================================
// File: src/app/api/tracks/route.ts
// Título: API Tracks (GET lista, POST crea)
// Descripción: Lista tracks desde la BD y permite crear (URL directa en esta etapa).
// Qué hace: Soporta el catálogo y el admin básico sin S3.
// Peras y manzanas: “Ver todo lo que hay” y “anotar una nueva canción en la libreta.”
// ================================================
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    const rows = await db.track.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    // 👇 Log más explícito para ver exactamente qué está fallando
    console.error("[GET /api/tracks] DB error:", e);
    return NextResponse.json(
      { error: "DB_UNAVAILABLE", detail: (e as Error).message ?? String(e) },
      { status: 503 }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const json = await req.json();
    // Payload mínimo: title, artist, audio.url
    const title = String(json?.title ?? "");
    const artist = String(json?.artist ?? "");
    const audioUrl = String(json?.audio?.url ?? "");
    if (!title || !artist || !audioUrl) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const created = await db.track.create({
      data: {
        title,
        artist,
        audioUrl,
        coverUrl: json?.coverUrl ?? null,
        moods: Array.isArray(json?.moods) ? json.moods : [],
        uses: Array.isArray(json?.uses) ? json.uses : [],
        isrc: json?.isrc ?? null,
        iswc: json?.iswc ?? null,
        upc: json?.upc ?? null,
        master: json?.rights?.master ?? null,
        publishingSplit: json?.rights?.publishingSplit ?? null,
        licenseType: json?.rights?.licenseType ?? null,
        territories: json?.rights?.territories ?? null,
        term: json?.rights?.term ?? null,
        mediaBuy: json?.rights?.mediaBuy ?? null,
        mfn: json?.rights?.mfn ?? null,
        restrictions: Array.isArray(json?.rights?.restrictions) ? json.rights.restrictions : [],
        contentIdEnrolled: json?.rights?.contentIdEnrolled ?? null,
        contentIdAdmin: json?.rights?.contentIdAdmin ?? null,
        contentIdWhitelist: json?.rights?.contentIdWhitelist ?? null,
        assetKey: String(json?.audio?.key ?? "external://" + audioUrl),
        assetMime: String(json?.audio?.mime ?? ""),
        assetSize: Number(json?.audio?.size ?? 0),
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/tracks] error:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
