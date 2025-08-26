import { z } from "zod";

export const playerIdentifiersSchema = z.object({
  isrc: z.string().min(1).optional(),
  iswc: z.string().min(1).optional(),
  upc: z.string().min(1).optional(),
});

export const playerRightsSchema = z.object({
  master: z.string().min(1).optional(),
  publishingSplit: z.string().min(1).optional(),
  licenseType: z.string().min(1).optional(),
  territories: z.string().min(1).optional(),
  term: z.string().min(1).optional(),
  scope: z.array(z.string().min(1)).optional(),
  mediaBuy: z.string().min(1).optional(),
  mfn: z.boolean().optional(),
  restrictions: z.array(z.string().min(1)).optional(),
  contentID: z.object({
    enrolled: z.boolean().optional(),
    admin: z.string().min(1).optional(),
    whitelist: z.string().email().optional(),
  }).optional(),
});

export const playerTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  // permitimos rutas relativas (no exigimos URL absoluta):
  audioUrl: z.string().min(1),
  coverUrl: z.string().min(1).optional(),
  moods: z.array(z.string().min(1)).optional(),
  uses: z.array(z.string().min(1)).optional(),
  shareUrl: z.string().min(1).optional(),
  artistUrl: z.string().min(1).optional(),
  rights: playerRightsSchema.optional(),
  identifiers: playerIdentifiersSchema.optional(),
});
export type PlayerTrackDTO = z.infer<typeof playerTrackSchema>;
