"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";
import useTagCatalog from "@/hooks/useTagCatalog";

/**
 * Wrapper para Categorías. Normaliza en Title Case y expone slug vía meta.
 */
export type CategoryChipsProps = {
  name?: string;
  initialCategories: { name: string; slug?: string }[];
  error?: string | null;
  maxItems?: number;
};

const toTitleCase = (txt: string) => {
  const clean = txt.trim();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

export function CategoryChips({
  name = "categories",
  initialCategories,
  error,
  maxItems = 15,
}: CategoryChipsProps) {
  const [selected, setSelected] = React.useState<TagChip[]>(
    initialCategories.map((c) => {
      const label = toTitleCase(c.name ?? "");
      return { label, value: label, meta: { slug: c.slug } };
    })
  );

  const catalog = useTagCatalog({
    listUrl: "/api/categories",
    searchUrl: "/api/categories",
    createUrl: "/api/categories",
    mapItem: (i: any) => {
      const name = toTitleCase((i?.name ?? i?.label ?? "").toString());
      const slug = (i?.slug ?? i?.value ?? "").toString();
      if (!name) return null as unknown as TagChip;
      return { id: i?.id, label: name, value: name, meta: { slug } };
    },
    buildCreateBody: (label) => ({ name: toTitleCase(label) }),
  });

  const normalize = React.useCallback((raw: string): TagChip | null => {
    const name = toTitleCase(raw);
    if (!name) return null;
    return { label: name, value: name };
  }, []);

  return (
    <div className="space-y-2">
      <TagChips
        selected={selected}
        onChange={setSelected}
        placeholder="Buscar categoría"
        toggleLabel="Categorías"
        maxItems={maxItems}
        headingAssigned="Categorías asignadas"
        headingSuggestions="Sugerencias del catálogo"
        fetchSuggestions={catalog.fetchSuggestions}
        fetchAll={catalog.fetchAll}
        normalize={normalize}
        allowCreate
        onCreate={catalog.create}
      />
      <input type="hidden" name={name} value={selected.map((c) => c.label).join("\n")} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default CategoryChips;
