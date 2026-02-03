"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";
import useTagCatalog from "@/hooks/useTagCatalog";

/**
 * Wrapper para gestionar "Usos" con el mismo flujo de TagChips.
 * Normaliza en Title Case mínima (primera letra mayúscula, resto minúscula).
 */
export type UseChipsProps = {
  name?: string;
  initialUses: string[];
  error?: string | null;
  maxItems?: number;
  trackId: string;
};

const toTitleCase = (txt: string) => {
  const clean = txt.trim();
  if (!clean) return "";
  if (clean.length <= 3) return clean.toUpperCase(); // TV, UX, etc.
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

export function UseChips({ name = "uses", initialUses, error, maxItems = 15, trackId }: UseChipsProps) {
  const [selected, setSelected] = React.useState<TagChip[]>(
    initialUses.map((u) => {
      const label = toTitleCase(u);
      return { label, value: label };
    })
  );

  const catalog = useTagCatalog({
    listUrl: "/api/uses",
    searchUrl: "/api/uses",
    createUrl: "/api/uses",
    mapItem: (i: any) => {
      const name = toTitleCase((i?.name ?? i?.label ?? "").toString());
      if (!name) return null as unknown as TagChip;
      return { id: i?.id, label: name, value: name };
    },
    buildCreateBody: (label) => ({ name: toTitleCase(label) }),
  });

  const normalize = React.useCallback((raw: string): TagChip | null => {
    const title = toTitleCase(raw);
    if (!title) return null;
    return { label: title, value: title };
  }, []);

  const persist = React.useCallback(
    async (chips: TagChip[]) => {
      const uses = chips.map((c) => toTitleCase(c.value ?? c.label));
      await fetch(`/api/tracks/${trackId}/uses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uses }),
      });
    },
    [trackId],
  );

  const handleChange = React.useCallback(
    (chips: TagChip[]) => {
      setSelected(chips);
      persist(chips);
    },
    [persist],
  );

  return (
    <div className="space-y-2">
      <TagChips
        selected={selected}
        onChange={handleChange}
        placeholder="Buscar uso"
        toggleLabel="Usos"
        maxItems={maxItems}
        headingAssigned="Usos asignados"
        headingSuggestions="Sugerencias del catálogo"
        fetchSuggestions={catalog.fetchSuggestions}
        fetchAll={catalog.fetchAll}
        normalize={normalize}
        allowCreate
        onCreate={catalog.create}
        allowDeleteCatalog
        onDeleteCatalog={async (chip) => {
          const payload: Record<string, string> = {};
          if (chip.id) payload.id = chip.id;
          else if (chip.value || chip.label) payload.name = (chip.value ?? chip.label) as string;
          else return false;
          const res = await fetch("/api/uses", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          return res.ok;
        }}
      />
      <input type="hidden" name={name} value={selected.map((c) => c.label).join("\n")} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default UseChips;
