/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Helper tipado para GET /api/tracks (view=list)                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Construye el querystring correcto (arrays -> claves repetidas).          │
 * │ - Llama al endpoint y valida con Zod el shape de respuesta.                │
 * │ - Expone utilidades para paginar (nextCursor) y para traer todas las       │
 * │   páginas (usar con cautela).                                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Primera página: getTracksList({ limit: 12, order: "createdAt", dir: "desc" })  │
 * │ - Siguiente: getTracksList({ ..., cursor: page1.nextCursor })              │
 * │ - No cambies filtros/orden entre páginas.                                  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import {
  tracksListResponseSchema,
  orderDirSchema,
  orderFieldSchema,
  type OrderDir,
  type OrderField,
  type TrackView,
} from "@/schema/tracks.list";

export type GetTracksParams = {
  q?: string;
  mood?: string[];
  use?: string[];
  limit?: number;              // 1..100 (default 20)
  cursor?: string | null;
  order?: OrderField;          // "createdAt" | "title" | "artist"
  dir?: OrderDir;              // "asc" | "desc"
  view?: Extract<TrackView, "list">; // fijo: "list"
};

function buildQuery(params: GetTracksParams): string {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", params.cursor);
  if (params.order && orderFieldSchema.safeParse(params.order).success) {
    qs.set("order", params.order);
  }
  if (params.dir && orderDirSchema.safeParse(params.dir).success) {
    qs.set("dir", params.dir);
  }

  // Proyección mínima para listado
  qs.set("view", "list");

  params.mood?.forEach((m) => qs.append("mood", m));
  params.use?.forEach((u) => qs.append("use", u));

  return qs.toString();
}

/** GET /api/tracks con validación Zod (view=list). */
export async function getTracksList(
  params: GetTracksParams = {},
  opts?: { signal?: AbortSignal; baseUrl?: string }
) {
  const base = opts?.baseUrl ?? "";
  const url = `${base}/api/tracks?${buildQuery(params)}`;

  const res = await fetch(url, {
    signal: opts?.signal,
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GET /api/tracks failed: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  const parsed = tracksListResponseSchema.parse(json);
  return parsed; // { items, nextCursor, totalCount }
}

/** Itera todas las páginas y acumula items (cuidado con volúmenes grandes). */
export async function getAllTracksList(
  params: Omit<GetTracksParams, "cursor"> = {},
  opts?: { baseUrl?: string }
) {
  let cursor: string | null = null;
  const all: (typeof tracksListResponseSchema)["_type"]["items"] = [];

  do {
    const page = await getTracksList({ ...params, cursor }, opts);
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);

  return all;
}
