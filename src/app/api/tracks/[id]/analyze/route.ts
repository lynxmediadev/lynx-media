import { type NextRequest, NextResponse } from "next/server";
import { analyzeTrackById } from "@/lib/audio/analyze";
import { normalizeTrackAsset } from "@/lib/assets/normalize";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Endpoint: POST /api/tracks/:id/analyze                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Ejecuta el análisis técnico (C2)                                         │
 * │ - (Opcional) Normaliza metadatos de asset si `?normalize=1` (C3)           │
 * │ Peras y manzanas                                                           │
 * │ - Usa runtime nodejs para poder leer FS/spawn ffmpeg/ffprobe               │
 * │ - La normalización NO descarga el archivo completo (HEAD/Range)            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params; // <- en Next 15 hay que await
  try {
    const url = new URL(req.url);
    const doNormalize = url.searchParams.get("normalize") === "1";

    const result = await analyzeTrackById(id);

    let normalizeOut: any = null;
    let warnings = [...(result.warnings ?? [])];
    if (doNormalize) {
      try {
        const n = await normalizeTrackAsset(id, false);
        normalizeOut = n.updated;
        // (n.warnings viene vacío normalmente)
      } catch (e: any) {
        warnings.push("asset normalize failed");
        normalizeOut = { error: e?.message ?? "normalize failed" };
      }
    }

    return NextResponse.json({ ok: true, ...result, normalized: normalizeOut, warnings });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
