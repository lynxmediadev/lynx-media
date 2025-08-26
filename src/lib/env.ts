import { z } from "zod";

// Añadiremos claves reales en Fase A/B (DB_URL, STORAGE_BUCKET, etc.)
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  // DB_URL: z.string().url().optional(),
  // S3_BUCKET: z.string().optional(),
  // ...
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  // DB_URL: process.env.DB_URL,
  // S3_BUCKET: process.env.S3_BUCKET,
});
