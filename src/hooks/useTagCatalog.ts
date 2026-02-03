import * as React from "react";
import type { TagChip } from "@/components/ui/TagChips";

type UseTagCatalogOptions = {
  listUrl: string;
  searchUrl?: string;
  createUrl?: string;
  headers?: Record<string, string>;
  mapItem?: (item: any) => TagChip;
  buildCreateBody?: (label: string) => any;
};

const defaultMapItem = (item: any): TagChip => {
  const name = (item?.name ?? item?.label ?? "").toString();
  const upper = name.toUpperCase();
  return {
    id: item?.id,
    label: upper,
    value: upper,
  };
};

const defaultCreateBody = (label: string) => ({ name: label });

/**
 * Hook genérico para catálogos de chips (moods, usos, categorías).
 * Devuelve funciones de fetch y create listas para pasar a TagChips.
 * No mantiene estado de selección; solo encapsula acceso a API y mapeo.
 */
export function useTagCatalog(options: UseTagCatalogOptions) {
  const {
    listUrl,
    searchUrl,
    createUrl,
    headers,
    mapItem = defaultMapItem,
    buildCreateBody = defaultCreateBody,
  } = options;

  const [loading, setLoading] = React.useState(false);

  const fetchAll = React.useCallback(async (): Promise<TagChip[]> => {
    const res = await fetch(listUrl, { headers });
    const data = await res.json().catch(() => ({}));
    const rawItems = Array.isArray(data) ? data : data.moods ?? data.items ?? [];
    return (rawItems as any[]).map(mapItem).filter(Boolean);
  }, [headers, listUrl, mapItem]);

  const fetchSuggestions = React.useCallback(
    async (query: string): Promise<TagChip[]> => {
      const q = query.trim();
      if (!q) return [];
      const url = searchUrl ?? listUrl;
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(`${url}${sep}query=${encodeURIComponent(q)}`, { headers });
      const data = await res.json().catch(() => ({}));
      const rawItems = Array.isArray(data) ? data : data.moods ?? data.items ?? [];
      return (rawItems as any[]).map(mapItem).filter(Boolean);
    },
    [headers, listUrl, mapItem, searchUrl]
  );

  const create = React.useCallback(
    async (label: string): Promise<TagChip | null> => {
      const clean = label.trim();
      if (!clean || !createUrl) return null;
      setLoading(true);
      try {
        const res = await fetch(createUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(headers ?? {}) },
          body: JSON.stringify(buildCreateBody(clean)),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return null;
        const payload = data.mood ?? data.item ?? data;
        return mapItem(payload);
      } catch (_e) {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [buildCreateBody, createUrl, headers, mapItem]
  );

  return {
    loading,
    fetchAll,
    fetchSuggestions,
    create,
  };
}

export default useTagCatalog;
