// ================================================
// File: src/schema/track.ts
// Título: Esquemas Zod (lectura vs creación)
// Descripción: playerTrackSchema = salida (DTO); trackCreateSchema = entrada (POST).
// ================================================
import { z } from "zod";

// --- Salida para el Player (DTO de lectura) ---
export const playerTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  audioUrl: z.string(),
  coverUrl: z.string().optional(),
  moods: z.array(z.string()),
  uses: z.array(z.string()),
  identifiers: z.object({
    isrc: z.string().optional(),
    iswc: z.string().optional(),
    upc: z.string().optional(),
  }).partial().optional(),
  rights: z.object({
    master: z.string().optional(),
    publishingSplit: z.string().optional(),
    licenseType: z.string().optional(),
    territories: z.string().optional(),
    term: z.string().optional(),
    mediaBuy: z.string().optional(),
    mfn: z.boolean().optional(),
    restrictions: z.array(z.string()).optional(),
    contentID: z.object({
      enrolled: z.boolean().optional(),
      admin: z.string().optional(),
      whitelist: z.string().optional(),
    }).partial().optional(),
  }).partial().optional(),
});
export type PlayerTrackDTO = z.infer<typeof playerTrackSchema>;

// --- Entrada para crear (payload del POST) ---
/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Título: trackCreateSchema (permisivo y robusto)
 * Qué hace: Acepta coverUrl ausente o null/vacía; moods/uses opcionales con [] por default.
 * Peras y manzanas: Evitamos 400 cuando el front no envía ciertos campos.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// Si tienes enums para moods/uses, reemplaza z.string() por z.enum([...]).
export const trackCreateSchema = z.object({
  title: z.string().min(1, "title requerido"),
  artist: z.string().min(1, "artist requerido"),
  audio: z.object({
    // Permitimos cualquier string no vacío (relativa o absoluta)
    url: z.string().min(1, "audio.url requerido"),
  }),
  // coverUrl puede no enviarse o venir null/"" → lo normalizamos a undefined
  coverUrl: z
    .string()
    .url("coverUrl debe ser URL válida")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),

  // arrays opcionales con default []
  moods: z.array(z.string()).optional().default([]),
  uses: z.array(z.string()).optional().default([]),
});

export type TrackCreateInput = z.infer<typeof trackCreateSchema>;
