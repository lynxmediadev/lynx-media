// src/app/api/_debug/ffmpeg/route.ts
/**
 * Endpoint de diagnóstico: muestra qué rutas ve el runtime y si corren `-version`.
 * GET /api/_debug/ffmpeg
 */
import { NextResponse } from "next/server";
import { execa } from "execa";
import { resolveFfmpegPaths } from "@/server/media/ffmpeg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function tryVersion(bin: string) {
  try {
    const r = await execa(bin, ["-version"], { timeout: 10_000, windowsHide: true });
    return { ok: true, firstLine: (r.stdout.split("\n")[0] || "").trim() };
  } catch (e: any) {
    return { ok: false, error: String(e?.shortMessage || e?.message || e) };
  }
}

export async function GET() {
  const { ffmpeg, ffprobe } = resolveFfmpegPaths();
  const a = await tryVersion(ffmpeg);
  const b = await tryVersion(ffprobe);
  return NextResponse.json({
    env: { FFMPEG_PATH: process.env.FFMPEG_PATH || "", FFPROBE_PATH: process.env.FFPROBE_PATH || "" },
    resolved: { ffmpeg, ffprobe },
    checks: { ffmpeg: a, ffprobe: b },
  });
}
