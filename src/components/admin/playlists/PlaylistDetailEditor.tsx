"use client";

import { useState } from "react";
import SaveStateBadge, { type SaveState } from "@/components/admin/ui/SaveStateBadge";
import { Button } from "@/components/ui/button";

type PlaylistDetailEditorProps = {
  item: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    visibility: "PRIVATE" | "INTERNAL" | "PUBLIC";
    featured: boolean;
    sortOrder: number;
  };
};

export function PlaylistDetailEditor({ item }: PlaylistDetailEditorProps) {
  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug);
  const [description, setDescription] = useState(item.description ?? "");
  const [status, setStatus] = useState(item.status);
  const [visibility, setVisibility] = useState(item.visibility);
  const [featured, setFeatured] = useState(item.featured);
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string>("");

  async function onSave() {
    setSaveState("saving");
    setError("");
    const parsedSortOrder = Number.parseInt(sortOrder, 10);

    try {
      const res = await fetch(`/api/admin/playlists/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() ? description.trim() : null,
          status,
          visibility,
          featured,
          sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudo guardar la playlist");
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSaveState("error");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Edición rápida</h2>
        <SaveStateBadge
          state={saveState}
          className="text-xs"
          savingLabel="Saving..."
          savedLabel="DONE"
          errorLabel="ERROR"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nombre</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slug</label>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visibilidad</label>
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as typeof visibility)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="PRIVATE">PRIVATE</option>
            <option value="INTERNAL">INTERNAL</option>
            <option value="PUBLIC">PUBLIC</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Orden</label>
          <input
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destacada</label>
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Featured
          </label>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {error ? <p className="text-xs text-destructive">{error}</p> : <span />}
        <Button type="button" size="sm" onClick={() => void onSave()}>
          Guardar cambios
        </Button>
      </div>
    </section>
  );
}
