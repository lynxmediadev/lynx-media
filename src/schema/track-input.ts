// ================================================
// File: src/schema/track-input.ts
// Título: Zod schema para crear Track (entrada de API)
// Descripción: Valida el payload que envía el formulario admin al crear un track.
// Qué hace: Asegura que vengan los campos mínimos correctos (título, artista, audio subido).
// Peras y manzanas: “Si falta el nombre o el archivo, no grabo nada en la base.”
// ================================================
import { z } from "zod";

export const createTrackInput = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  audio: z.object({
    key: z.string().min(1),
    url: z.string().url(),       // publicUrl
    size: z.number().int().nonnegative(),
    mime: z.string().min(1),
  }),
  coverUrl: z.string().url().optional(),
  moods: z.array(z.string().min(1)).default([]),
  uses: z.array(z.string().min(1)).default([]),

  // opcionales (MVP)
  isrc: z.string().optional(),
  iswc: z.string().optional(),
  upc: z.string().optional(),
  rights: z.object({
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
    contentIdWhitelist: z.string().email().optional(),
  }).optional(),
});
export type CreateTrackInput = z.infer<typeof createTrackInput>;
