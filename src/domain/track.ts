// ================================================
// File: src/schema/track.ts
// Título: Esquemas Zod para Tracks (entrada/salida)
// Descripción: Agregamos `trackCreateSchema` para validar el POST /api/tracks.
// Qué hace: Valida título, artista, audio.url y metadatos opcionales.
// Peras y manzanas: “No guardo una canción si no sé cómo se llama,
//                    de quién es y dónde reproducirla.”
// ================================================
import { z } from "zod";

// (ya existente) Esquema de lectura para el Player (DTO):
export const playerTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  audioUrl: z.string(),
  coverUrl: z.string().optional(),
  moods: z.array(z.string()),
  uses: z.array(z.string()),
  identifiers: z
    .object({
      isrc: z.string().optional(),
      iswc: z.string().optional(),
      upc: z.string().optional(),
    })
    .partial()
    .optional(),
  rights: z
    .object({
      master: z.string().optional(),
      publishingSplit: z.string().optional(),
      licenseType: z.string().optional(),
      territories: z.string().optional(),
      term: z.string().optional(),
      mediaBuy: z.string().optional(),
      mfn: z.boolean().optional(),
      restrictions: z.array(z.string()).optional(),
      contentID: z
        .object({
          enrolled: z.boolean().optional(),
          admin: z.string().optional(),
          whitelist: z.string().optional(),
        })
        .partial()
        .optional(),
    })
    .partial()
    .optional(),
});
export type PlayerTrackDTO = z.infer<typeof playerTrackSchema>;

// (nuevo) Esquema de creación para el POST:
export const trackCreateSchema = z.object({
  title: z.string().min(1, "title es requerido"),
  artist: z.string().min(1, "artist es requerido"),
  audio: z.object({
    // Permitimos rutas relativas (ej. /audio/demo.mp3) o URLs absolutas
    url: z
      .string()
      .min(1, "audio.url es requerido")
      .refine((s) => s.startsWith("/") || /^https?:\/\//i.test(s), {
        message: "audio.url debe ser ruta relativa o URL http(s)",
      }),
    key: z.string().optional(),
    size: z.number().int().nonnegative().optional(),
    mime: z.string().optional(),
  }),
  coverUrl: z
    .string()
    .optional()
    .refine((s) => !s || s.startsWith("/") || /^https?:\/\//i.test(s), {
      message: "coverUrl debe ser ruta relativa o URL http(s)",
    }),
  moods: z.array(z.string()).default([]),
  uses: z.array(z.string()).default([]),

  identifiers: z
    .object({
      isrc: z.string().optional(),
      iswc: z.string().optional(),
      upc: z.string().optional(),
    })
    .partial()
    .optional(),

  rights: z
    .object({
      master: z.string().optional(),
      publishingSplit: z.string().optional(),
      licenseType: z.string().optional(),
      territories: z.string().optional(),
      term: z.string().optional(),
      mediaBuy: z.string().optional(),
      mfn: z.boolean().optional(),
      restrictions: z.array(z.string()).optional(),
      contentIdEnrolled: z.boolean().optional(),
      contentIdAdmin: z.string().optional(),
      contentIdWhitelist: z.string().optional(),
    })
    .partial()
    .optional(),
});
export type TrackCreateInput = z.infer<typeof trackCreateSchema>;
