/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/lib/audio/paths.ts                                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Propósito                                                                  │
 * │ Resolver rutas a ffprobe/ffmpeg para Windows/Mac/Linux corrigiendo         │
 * │ prefijos \ROOT\, comillas y espacios. Ofrece funciones get* idempotentes.  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as fs from "node:fs";
import * as path from "node:path";

function stripQuotes(p?: string | null) {
  if (!p) return p ?? "";
  return p.replace(/^"(.*)"$/, "$1").trim();
}
function fixRootPrefix(p?: string | null) {
  if (!p) return p ?? "";
  let s = stripQuotes(p);
  if (/^[\\/ ]?ROOT[\\/]/i.test(s)) {
    const rel = s.replace(/^[\\/ ]?ROOT[\\/]/i, "");
    s = path.join(process.cwd(), rel);
  }
  return s;
}
function exists(p?: string | null) {
  if (!p) return false;
  try { fs.accessSync(p); return true; } catch { return false; }
}
function pick(candidates: Array<string | undefined>, fallbackCmd: string) {
  for (const c of candidates) {
    const fixed = fixRootPrefix(c);
    if (exists(fixed)) return fixed;
  }
  return fallbackCmd;
}

export function getFfprobePath() {
  let modulePath: string | undefined;
  try { modulePath = (require("ffprobe-static").path as string); } catch {}
  return pick([process.env.FFPROBE_PATH, modulePath], "ffprobe");
}

export function getFfmpegPath() {
  let modulePath: string | undefined;
  try { modulePath = (require("ffmpeg-static") as unknown as string); } catch {}
  return pick([process.env.FFMPEG_PATH, modulePath], "ffmpeg");
}

// Exportar “por compatibilidad”
export const ffprobePath = getFfprobePath();
export const ffmpegPath  = getFfmpegPath();
