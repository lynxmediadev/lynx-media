// src/lib/storage/delete-object.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Helper: borrado de objetos en S3/R2                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Construye un S3Client apuntando a tu bucket S3/R2 (Cloudflare R2).       │
 * │ - Expone deleteObjectFromS3(key) para borrar un objeto por su Key.         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Le pasas el assetKey del track (ej: "uploads/2025/11/track.wav").        │
 * │ - Si la configuración S3 no está completa, loggea y no rompe la app.       │
 * │ - Si falla el borrado remoto, loggea el error pero NO lanza excepción.     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";

let s3DeleteClient: S3Client | null = null;

/**
 * Construye (lazy) un S3Client configurado para Cloudflare R2.
 * Si falta configuración crítica, devuelve null y loggea.
 */
function getS3DeleteClient(): S3Client | null {
  if (s3DeleteClient) return s3DeleteClient;

  // Validación mínima para evitar petadas raras
  if (
    !env.S3_ENDPOINT ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    console.warn(
      "[storage:delete-object] Configuración S3/R2 incompleta; se omite borrado remoto.",
      {
        endpoint: env.S3_ENDPOINT,
        hasAccessKey: !!env.S3_ACCESS_KEY_ID,
        hasSecret: !!env.S3_SECRET_ACCESS_KEY,
      },
    );
    return null;
  }

  s3DeleteClient = new S3Client({
    region: env.S3_REGION ?? "auto",
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  return s3DeleteClient;
}

/**
 * Borra un objeto del bucket configurado en S3/R2.
 *
 * @param key assetKey del Track (ej: "uploads/2025/11/track.wav")
 * @returns "ok" | "skipped" | "error"
 */
export async function deleteObjectFromS3(
  key: string | null | undefined,
): Promise<"ok" | "skipped" | "error"> {
  if (!key) {
    // No hay nada que borrar
    return "skipped";
  }

  if (!env.S3_BUCKET) {
    console.warn(
      "[storage:delete-object] S3_BUCKET no definido; se omite borrado remoto de",
      key,
    );
    return "skipped";
  }

  const client = getS3DeleteClient();
  if (!client) {
    // Ya se loggeó por qué no se puede crear el cliente.
    return "skipped";
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
      }),
    );
    console.log("[storage:delete-object] Borrado en S3/R2:", {
      bucket: env.S3_BUCKET,
      key,
    });
    return "ok";
  } catch (err) {
    console.error(
      "[storage:delete-object] Error al borrar objeto en S3/R2:",
      { bucket: env.S3_BUCKET, key },
      err,
    );
    return "error";
  }
}
