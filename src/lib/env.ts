// ================================================
// File: src/lib/env.ts
// Título: Variables de entorno (validación con Zod)
// Descripción: Centraliza y valida todas las variables de entorno necesarias
//              para BD y storage antes de arrancar el servidor.
// Qué hace: Si falta algo crítico (DB_URL, credenciales S3/R2...), lanza error
//           temprano. Evita fallas sorpresivas en producción.
// Peras y manzanas: “Si no tengo las llaves del auto, no intento manejar.
//                    Paro aquí mismo y pido las llaves (env).”
// ================================================
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Base de datos (Postgres)
  DATABASE_URL: z.string().url(),

  // S3/R2 (S3-compatible). Para Cloudflare R2 usa endpoint propio.
  S3_ENDPOINT: z.string().url().optional(), // ej: https://<accountid>.r2.cloudflarestorage.com
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),

  // URL pública del bucket (CDN o Website endpoint) para servir archivos
  S3_PUBLIC_BASE_URL: z.string().url(), // ej: https://cdn.tudominio.com
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,

  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_REGION: process.env.S3_REGION,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
});
