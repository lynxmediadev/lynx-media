/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Zod DTO para vista full de Track                                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Define el shape completo que retorna el backend en view=full              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Úsalo en páginas de detalle/ficha técnica                                 │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { z } from "zod";

export const trackFullSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
  artist: z.string(),
  audioUrl: z.string(),
  coverUrl: z.string().nullable().optional(),
  moods: z.array(z.string()),
  uses: z.array(z.string()),
  // Identificadores / derechos (ajusta a tu modelo real)
  isrc: z.string().nullish(),
  iswc: z.string().nullish(),
  upc: z.string().nullish(),
  master: z.string().nullish(),
  publishingSplit: z.string().nullish(),
  licenseType: z.string().nullish(),
  territories: z.string().nullish(),
  term: z.string().nullish(),
  mediaBuy: z.string().nullish(),
  mfn: z.boolean().nullish(),
  restrictions: z.array(z.string()).nullish(),
  contentIdEnrolled: z.boolean().nullish(),
  contentIdAdmin: z.string().nullish(),
  contentIdWhitelist: z.string().nullish(),
  assetKey: z.string(),
  assetMime: z.string(),
  assetSize: z.number(),
  durationSec: z.number().nullish(),
  loudnessLufs: z.number().nullish(),
});
export type TrackFull = z.infer<typeof trackFullSchema>;
