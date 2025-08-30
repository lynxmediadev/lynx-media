// src/lib/audio/paths.ts
// Resolución robusta de rutas de binarios ffprobe/ffmpeg para Next 15 + Turbopack (evita "\ROOT\...").

import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const req = createRequire(import.meta.url);

function looksBad(p?: string) {
  return !!p && (/[/\\]ROOT[/\\]/.test(p) || p.startsWith("\\ROOT") || p.startsWith("/ROOT"));
}

function platDir() {
  if (process.platform === "win32") return "win32";
  if (process.platform === "darwin") return "darwin";
  return "linux";
}

function archDir() {
  // ffprobe-static usa x64/arm64/ia32 como carpetas
  if (process.arch === "x64") return "x64";
  if (process.arch === "arm64") return "arm64";
  return "ia32";
}

export function resolveFfprobePath(): string {
  try {
    const mod = req("ffprobe-static"); // CJS
    const p: string | undefined = (mod && (mod as any).path) as any;
    if (p && !looksBad(p)) return p;

    // Fallback: reconstruir desde index.js del paquete
    const idx = req.resolve("ffprobe-static"); // .../node_modules/ffprobe-static/index.js
    const base = dirname(idx);
    const exe = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
    return join(base, "bin", platDir(), archDir(), exe);
  } catch {
    // Último recurso: confiar en PATH del sistema
    return process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  }
}

export function resolveFfmpegPath(): string {
  try {
    const mod = req("ffmpeg-static"); // devuelve string a binario
    const p: string =
      typeof mod === "string" ? (mod as string) : ((mod as any)?.path as string);
    if (p && !looksBad(p)) return p;

    // Fallback: en ffmpeg-static el binario está en la raíz del paquete
    const idx = req.resolve("ffmpeg-static"); // .../node_modules/ffmpeg-static/index.js
    const base = dirname(idx);
    const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    return join(base, exe);
  } catch {
    // Último recurso: confiar en PATH
    return process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  }
}
