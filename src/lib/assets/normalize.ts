/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/lib/assets/normalize.ts                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Propósito                                                                  │
 * │ Normalizar metadatos del asset de audio a partir de su URL pública:        │
 * │ - Derivar/estandarizar `assetKey` (naming canónico en el bucket)           │
 * │ - Obtener `assetMime` (Content-Type) sin descargar el archivo completo     │
 * │ - Obtener `assetSize` (Content-Length, en bytes)                            │
 * │ Además incluye un helper para aplicar esto directamente a un Track en DB.  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ Piensa que tenemos una URL (p.ej. https://cdn.mi-r2.com/audio/2025/08/29/  │
 * │ uuid-demo-v1.mp3). Con un HEAD/GET con Range=0-0 pedimos SOLO los headers  │
 * │ y rellenamos los campos en la base de datos. No renombramos nada en R2,    │
 * │ sólo normalizamos los metadatos locales.                                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { getS3PublicUrl } from "@/lib/storage/s3";
import { publicUrlToKey } from "@/lib/storage/r2-stream";

/** Resultado mínimo para UI/API */
export type NormalizedAsset = {
  key: string;       // p.ej. "audio/2025/08/29/uuid-slug-v1.mp3"
  mime: string;      // p.ej. "audio/mpeg"
  size: number;      // bytes
};

/**
 * Extrae key/filename/ext de una URL pública (ignora querystring). Si la URL
 * no pertenece a nuestro CDN (S3_PUBLIC_BASE_URL), `key` será null.
 */
export function parseAssetUrl(url: string): { key: string | null; filename: string | null; ext: string | null } {
  const clean = url.split('?')[0] ?? url;
  const key = publicUrlToKey(clean);
  const filenameMatch = clean.match(/[^/]+$/);
  const filename = filenameMatch ? filenameMatch[0] : null;
  const extMatch = filename ? filename.match(/\.([a-z0-9]+)$/i) : null;
  const ext = extMatch?.[1] ? extMatch[1].toLowerCase() : null;
  return { key, filename, ext };
}

/** Mapa básico de extensiones comunes para audio → MIME */
const EXT_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  mpga: "audio/mpeg",
  wav: "audio/wav",
  wave: "audio/wav",
  flac: "audio/flac",
  aif: "audio/aiff",
  aiff: "audio/aiff",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  aac: "audio/aac",
  wma: "audio/x-ms-wma",
};

/** Deduce MIME desde extensión conocida */
export function guessMime(ext?: string | null): string | undefined {
  if (!ext) return undefined;
  return EXT_MIME[ext.toLowerCase()];
}

/** Intenta HEAD; si no funciona, hace GET con Range: bytes=0-0 para sólo headers */
export async function headAsset(urlOrKey: string): Promise<{ contentType?: string; contentLength?: number }> {
  const url = /^https?:/i.test(urlOrKey) ? urlOrKey : getS3PublicUrl(urlOrKey);
  // 1) HEAD
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || undefined;
      const len = res.headers.get("content-length");
      const contentLength = len != null ? Number(len) : undefined;
      return { contentType, contentLength };
    }
  } catch {
    // ignorar y fallback
  }
  // 2) GET con rango mínimo
  try {
    const res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" } });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || undefined;
      const len = res.headers.get("content-length");
      const contentLength = len != null ? Number(len) : undefined;
      // Importante: NO consumimos el body
      return { contentType, contentLength };
    }
  } catch {
    // ignorar
  }
  return {};
}

/**
 * Genera un assetKey canónico si la URL no sigue el patrón esperado.
 * Convención: audio/YYYY/MM/DD/<uuid>-<slug>-v1.<ext>
 * NOTA: No renombra en R2; sólo retorna el key a usar como metadato local.
 */
export function ensureKeyConvention(input: { url: string; proposedKey?: string }): { key: string } {
  const { url, proposedKey } = input;
  // 1) Si viene propuesto explícito, úsalo
  if (proposedKey && proposedKey.trim()) return { key: proposedKey.trim() };

  const { key: keyFromUrl, filename, ext } = parseAssetUrl(url);
  // 2) Si la URL pertenece a nuestro CDN y ya tenemos key legible, lo mantenemos.
  if (keyFromUrl && /^(audio|uploads)\//.test(keyFromUrl) && /\.[a-z0-9]+$/i.test(keyFromUrl)) {
    return { key: keyFromUrl };
  }

  // 3) Generar un key canónico a partir de la fecha actual y el filename
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');

  const base = (filename || 'audio')
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 6) // máx 6 palabras
    .join('-') || 'audio';

  const id = randomUUID();
  const version = 1;
  const extension = (ext || 'mp3').toLowerCase();
  const canonical = `audio/${yyyy}/${mm}/${dd}/${id}-${base}-v${version}.${extension}`;
  return { key: canonical };
}

/** Orquestador: URL pública → { key, mime, size } */
export async function normalizeAssetFromUrl(url: string): Promise<NormalizedAsset> {
  const { ext } = parseAssetUrl(url);
  const head = await headAsset(url);
  const mime = head.contentType || guessMime(ext) || "application/octet-stream";
  const size = head.contentLength ?? 0;
  const { key } = ensureKeyConvention({ url });
  return { key, mime, size };
}

/**
 * Idempotente: si el track ya tiene assetKey/Mime/Size válidos, no los toca
 * a menos que `force=true`. Devuelve un subconjunto para UI.
 */
export async function normalizeTrackAsset(trackId: string, force = false) {
  const track = await db.track.findUnique({ where: { id: trackId } });
  if (!track) throw new Error("Track no encontrado");
  if (!track.audioUrl) throw new Error("Track no tiene audioUrl");

  const currentOk =
    !!track.assetKey && /\.[a-z0-9]+$/.test(track.assetKey) &&
    !!track.assetMime && track.assetMime.length > 0 &&
    !!track.assetSize && track.assetSize > 0;

  if (currentOk && !force) {
    return {
      updated: { id: track.id, assetKey: track.assetKey, assetMime: track.assetMime, assetSize: track.assetSize },
      warnings: [] as string[],
    };
  }

  const norm = await normalizeAssetFromUrl(track.audioUrl);
  const updated = await db.track.update({
    where: { id: track.id },
    data: {
      assetKey: norm.key,
      assetMime: norm.mime,
      assetSize: norm.size,
    },
    select: { id: true, assetKey: true, assetMime: true, assetSize: true },
  });

  return { updated, warnings: [] as string[] };
}
