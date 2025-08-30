import { type NextRequest, NextResponse } from "next/server";
import { analyzeTrackById } from "@/lib/audio/analyze";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params; // <- en Next 15 hay que await
  try {
    const result = await analyzeTrackById(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
