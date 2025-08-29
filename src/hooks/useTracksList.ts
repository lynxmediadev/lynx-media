/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Hook useTracksList (lista + paginación por cursor)                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Gestiona estado de items, totalCount, nextCursor, loading y error.       │
 * │ - Pide la primera página con los filtros dados y expone loadMore().        │
 * │ - Cancela peticiones en vuelo (AbortController) y evita condiciones de carrera. │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - const { items, loadMore } = useTracksList({ limit: 12, order: "createdAt", dir: "desc" }) │
 * │ - Llama loadMore() para traer la siguiente página (si hay nextCursor).     │
 * │ - Si cambias filtros, el hook resetea y vuelve a cargar desde la página 1. │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTracksList, type GetTracksParams } from "@/lib/api/tracks";
import { orderDirSchema, orderFieldSchema } from "@/schema/tracks.list";

export type UseTracksListParams = Omit<GetTracksParams, "cursor" | "view"> & {
  // Filtros controlados desde el componente que usa el hook
};

export function useTracksList(params: UseTracksListParams) {
  // Sanitizar una vez (evita re-renders por objetos nuevos)
  const baseParams = useMemo<GetTracksParams>(() => {
    const clean: GetTracksParams = {
      q: params.q?.trim() || undefined,
      limit:
        typeof params.limit === "number"
          ? Math.min(Math.max(params.limit, 1), 100)
          : undefined,
      order: params.order && orderFieldSchema.safeParse(params.order).success ? params.order : "createdAt",
      dir: params.dir && orderDirSchema.safeParse(params.dir).success ? params.dir : "desc",
      mood: params.mood?.filter(Boolean),
      use: params.use?.filter(Boolean),
      view: "list",
    };
    return clean;
  }, [params.q, params.limit, params.order, params.dir, params.mood, params.use]);

  const [items, setItems] = useState<ReturnType<typeof getTracksList> extends Promise<infer R> ? R["items"] : never>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  const fetchPage = useCallback(
    async (cursor?: string | null, mode: "replace" | "append" = "replace") => {
      if (loadingRef.current) abortRef.current?.abort();
      setIsLoading(true);
      setError(null);
      loadingRef.current = true;

      const myId = ++reqIdRef.current;
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const page = await getTracksList({ ...baseParams, cursor: cursor ?? null }, { signal: ac.signal });

        // Ignora respuestas obsoletas (race conditions)
        if (myId !== reqIdRef.current) return;

        setTotalCount(page.totalCount);
        setNextCursor(page.nextCursor);
        setItems((prev) => (mode === "append" ? [...prev, ...page.items] : page.items));
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") {
          setError((e as Error)?.message ?? "Error desconocido");
        }
      } finally {
        if (myId === reqIdRef.current) {
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [baseParams]
  );

  // Cargar primera página cada vez que cambian los filtros base
  useEffect(() => {
    fetchPage(null, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseParams]);

  const loadMore = useCallback(() => {
    if (!nextCursor || isLoading) return;
    fetchPage(nextCursor, "append");
  }, [fetchPage, isLoading, nextCursor]);

  const reset = useCallback(() => {
    fetchPage(null, "replace");
  }, [fetchPage]);

  return { items, totalCount, nextCursor, isLoading, error, loadMore, reset };
}
