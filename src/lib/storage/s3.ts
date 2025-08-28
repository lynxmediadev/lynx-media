// ================================================
// File: src/lib/storage/s3.ts
// Título: Firma de subidas a S3/R2 (URL firmadas)
// Descripción: Genera una URL temporal (pre-signed) para subir el archivo desde el navegador, directo al bucket.
// Qué hace: Evita que el backend reciba el binario; solo firma y devuelve {uploadUrl, key, publicUrl}.
// Peras y manzanas: “Pido permiso, me dan un link de carga, y subo la caja directo a la bodega.”
// ================================================
import { env } from "@/lib/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: !!env.S3_ENDPOINT, // R2 requiere path-style
});

export type SignedUpload = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

function randomKey(prefix: string, fileName: string): string {
  const id = crypto.randomBytes(8).toString("hex");
  const clean = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${prefix}/${id}/${clean}`;
}

export async function signUpload(params: { fileName: string; contentType: string; prefix?: string }): Promise<SignedUpload> {
  const prefix = params.prefix ?? "tracks";
  const key = randomKey(prefix, params.fileName);

  const put = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, put, { expiresIn: 60 * 5 }); // 5 minutos
  const publicUrl = `${env.S3_PUBLIC_BASE_URL}/${key}`;
  return { key, uploadUrl, publicUrl };
}
