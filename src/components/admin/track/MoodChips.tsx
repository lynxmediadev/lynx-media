"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";
import useTagCatalog from "@/hooks/useTagCatalog";
import { slugify } from "@/lib/slugify";
import { useRouter } from "next/navigation";

type Props = {
  name?: string;
  initialMoods: string[];
  error?: string | null;
  trackId: string;
};

export function MoodChips({ name = "moods", initialMoods, error, trackId }: Props) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<TagChip[]>(() =>
    initialMoods.map((m) => {
      const label = m.toUpperCase();
      return { label, value: label, meta: { slug: slugify(label) } };
    }),
  );
  const [saving, setSaving] = React.useState(false);

  const catalog = useTagCatalog({
    listUrl: "/api/moods",
    searchUrl: "/api/moods",
    createUrl: "/api/moods",
    normalizeLabel: (raw) => raw.trim().toUpperCase(),
    normalizeSlug: (raw) => slugify(raw),
    mapItem: (m: any) => {
      const name = (m?.name ?? "").toString().trim();
      const upper = name.toUpperCase();
      if (!upper) return null as unknown as TagChip;
      return { id: m?.id, label: upper, value: upper, meta: { slug: slugify(upper) } };
    },
    buildCreateBody: (label) => ({ name: label.toUpperCase().trim() }),
  });

  const normalize = React.useCallback((raw: string): TagChip | null => {
    const clean = raw.trim();
    if (!clean) return null;
    const upper = clean.toUpperCase();
    return { label: upper, value: upper, meta: { slug: slugify(upper) } };
  }, []);

  const persist = React.useCallback(
    async (chips: TagChip[]) => {
      const moods = chips.map((c) => (c.value ?? c.label).toUpperCase());
      setSaving(true);
      try {
        const res = await fetch(`/api/tracks/${trackId}/moods`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moods }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.items)) {
          setSelected(
            data.items.map((item: any) => {
              const label = (item.name ?? item.slug ?? "").toString().toUpperCase();
              const slug = slugify(label);
              return { id: item.id, label, value: label, meta: { slug } };
            }),
          );
          try {
            const ref = await fetch(`/api/tracks/${trackId}/moods`);
            const json = await ref.json().catch(() => ({}));
            if (Array.isArray(json?.items)) {
              setSelected(
                json.items.map((item: any) => {
                  const label = (item.name ?? item.slug ?? "").toString().toUpperCase();
                  const slug = slugify(label);
                  return { id: item.id, label, value: label, meta: { slug } };
                }),
              );
            }
          } catch (_e) {
            /* ignore */
          }
          router.refresh();
        }
      } finally {
        setSaving(false);
      }
    },
    [trackId, router],
  );

  // Rehidrata al montar SOLO si no vino SSR (para evitar parpadeo/doble lista)
  React.useEffect(() => {
    if (!trackId) return;
    if ((initialMoods?.length ?? 0) > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tracks/${trackId}/moods`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (Array.isArray(data?.items)) {
          const next = data.items
            .map((item: any) => {
              const label = (item.name ?? item.slug ?? "").toString().toUpperCase();
              const slug = slugify(label);
              return { id: item.id, label, value: label, meta: { slug } };
            })
            .filter((c) => c.label);
          setSelected(next);
        }
      } catch (_e) {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackId, initialMoods]);

  const handleChange = React.useCallback(
    (chips: TagChip[]) => {
      setSelected(chips);
    },
    [],
  );

  return (
    <div className="space-y-2">
      <TagChips
        selected={selected}
        onChange={handleChange}
        placeholder="Buscar mood"
        toggleLabel="Moods"
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
        renderAboveToggle={
          <div className="flex gap-2 mb-1 w-full">
            <button
              type="button"
              onClick={() => persist(selected)}
              disabled={saving}
              className="h-7 px-3 border border-current w-full justify-center items-center text-foreground bg-transparent hover:bg-foreground/10 dark:hover:bg-foreground/15 transition-colors inline-flex text-xs font-semibold rounded-md"
            >
              {saving ? "Guardando…" : "Guardar Moods"}
            </button>
          </div>
        }
      />
      <input type="hidden" name={name} value={selected.map((c) => c.label).join("\n")} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
