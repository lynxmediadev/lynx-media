/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Zod DTOs para listado de Tracks (proyección + respuesta API)       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Define enums (order, dir, view), el item mínimo (view=list) y la         │
 * │   respuesta estándar { items, nextCursor, totalCount }.                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - "list": trae lo justo para pintar tarjetas.                              │
 * │ - "full": deja que el backend retorne el modelo completo.                  │
 * │ - Tipos seguros para frontend y validación runtime.                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { z } from "zod";

export const orderFieldSchema = z.enum(["createdAt", "title", "artist"]);
export type OrderField = z.infer<typeof orderFieldSchema>;

export const orderDirSchema = z.enum(["asc", "desc"]);
export type OrderDir = z.infer<typeof orderDirSchema>;

export const trackViewSchema = z.enum(["list", "full"]);
export type TrackView = z.infer<typeof trackViewSchema>;

export const trackListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  coverUrl: z.string().nullish().optional(),
  moods: z.array(z.string()).default([]),
  uses: z.array(z.string()).default([]),
});

export const tracksListResponseSchema = z.object({
  items: z.array(trackListItemSchema),
  nextCursor: z.string().nullable(),
  totalCount: z.number().int().nonnegative(),
});

export type TrackListItem = z.infer<typeof trackListItemSchema>;
export type TracksListResponse = z.infer<typeof tracksListResponseSchema>;
