"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";
import useTagCatalog from "@/hooks/useTagCatalog";

type Props = {
  name?: string;
  initialMoods: string[];
  error?: string | null;
  trackId: string;
};

export function MoodChips({ name = "moods", initialMoods, error, trackId }: Props) {
  const [selected, setSelected] = React.useState<TagChip[]>(
    initialMoods.map((m) => ({ label: m.toUpperCase(), value: m.toUpperCase() })),
  );

  const catalog = useTagCatalog({
    listUrl: "/api/moods",
    searchUrl: "/api/moods",
    createUrl: "/api/moods",
    mapItem: (m: any) => {
      const name = (m?.name ?? "").toString().trim();
      const upper = name.toUpperCase();
      if (!upper) return null as unknown as TagChip;
      return { id: m?.id, label: upper, value: upper };
    },
    buildCreateBody: (label) => ({ name: label.toUpperCase().trim() }),
  });

  const normalize = React.useCallback((raw: string): TagChip | null => {
    const clean = raw.trim();
    if (!clean) return null;
    const upper = clean.toUpperCase();
    return { label: upper, value: upper };
  }, []);

  const persist = React.useCallback(
    async (chips: TagChip[]) => {
      const moods = chips.map((c) => (c.value ?? c.label).toUpperCase());
      await fetch(`/api/tracks/${trackId}/moods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moods }),
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
        placeholder="Buscar mood"
        maxItems={10}
        headingAssigned="Moods asignados"
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
          const res = await fetch("/api/moods", {
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
