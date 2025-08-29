/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Utilidad S3/R2 (cliente + config)                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Crea S3Client para R2 (S3-compatible)                                    │
 * │ - Expone config validada y helper para construir publicUrl                 │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - getS3() para firmar (server-only).                                       │
 * │ - getS3PublicUrl(key) para la URL pública final.                           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { S3Client } from "@aws-sdk/client-s3";

const env = {
  bucket: process.env.S3_BUCKET ?? "",
  region: process.env.S3_REGION ?? "",
  endpoint: process.env.S3_ENDPOINT ?? "",
  forcePathStyle: /^(1|true)$/i.test(process.env.S3_FORCE_PATH_STYLE ?? ""),
  accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  publicBaseUrl: (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/+$/, ""),
  maxMB: Number(process.env.UPLOAD_MAX_MB ?? "50"),
  allowedMimeCsv: process.env.UPLOAD_ALLOWED_MIME ?? "audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/ogg,audio/mp4",
};

export function getUploadConfig() {
  const missing: string[] = [];
  if (!env.bucket) missing.push("S3_BUCKET");
  if (!env.endpoint) missing.push("S3_ENDPOINT");
  if (!env.accessKeyId) missing.push("S3_ACCESS_KEY_ID");
  if (!env.secretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");
  if (!env.publicBaseUrl) missing.push("S3_PUBLIC_BASE_URL");

  return {
    ok: missing.length === 0,
    missing,
    bucket: env.bucket,
    region: env.region || "auto",
    endpoint: env.endpoint,
    forcePathStyle: env.forcePathStyle,
    creds: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
    publicBaseUrl: env.publicBaseUrl,
    maxBytes: Math.max(1, Math.floor(env.maxMB * 1024 * 1024)),
    allowedMimes: env.allowedMimeCsv.split(",").map((s) => s.trim()).filter(Boolean),
  };
}

let s3Client: S3Client | null = null;
export function getS3() {
  if (s3Client) return s3Client;
  const cfg = getUploadConfig();
  s3Client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
    credentials: cfg.creds,
  });
  return s3Client;
}

export function getS3PublicUrl(key: string) {
  const cfg = getUploadConfig();
  return `${cfg.publicBaseUrl}/${key}`;
}
