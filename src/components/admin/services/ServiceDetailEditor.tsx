"use client";

import { useState } from "react";
import SaveStateBadge, { type SaveState } from "@/components/admin/ui/SaveStateBadge";
import { Button } from "@/components/ui/button";

type ServiceDetailEditorProps = {
  item: {
    id: string;
    name: string;
    slug: string;
    category: "MIX_MASTER" | "PRODUCTION" | "COMPOSITION" | "SOUND_DESIGN" | "OTHER";
    status: "ACTIVE" | "PAUSED" | "ARCHIVED";
    description: string | null;
    priceFrom: number | null;
    priceTo: number | null;
    currency: "CLP" | "USD" | "EUR";
    turnaroundDays: number | null;
    featured: boolean;
    sortOrder: number;
  };
};

function parseNullableInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ServiceDetailEditor({ item }: ServiceDetailEditorProps) {
  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug);
  const [category, setCategory] = useState(item.category);
  const [status, setStatus] = useState(item.status);
  const [description, setDescription] = useState(item.description ?? "");
  const [priceFrom, setPriceFrom] = useState(item.priceFrom != null ? String(item.priceFrom) : "");
  const [priceTo, setPriceTo] = useState(item.priceTo != null ? String(item.priceTo) : "");
  const [currency, setCurrency] = useState(item.currency);
  const [turnaroundDays, setTurnaroundDays] = useState(item.turnaroundDays != null ? String(item.turnaroundDays) : "");
  const [featured, setFeatured] = useState(item.featured);
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string>("");

  async function onSave() {
    setSaveState("saving");
    setError("");

    try {
      const res = await fetch(`/api/admin/services/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          category,
          status,
          description: description.trim() ? description.trim() : null,
          priceFrom: parseNullableInt(priceFrom),
          priceTo: parseNullableInt(priceTo),
          currency,
          turnaroundDays: parseNullableInt(turnaroundDays),
          featured,
          sortOrder: parseNullableInt(sortOrder) ?? 0,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudo guardar el servicio");
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
        <SaveStateBadge state={saveState} className="text-xs" savingLabel="Saving..." savedLabel="DONE" errorLabel="ERROR" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nombre</label>
          <input value={name} onChange={(event) => setName(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slug</label>
          <input value={slug} onChange={(event) => setSlug(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</label>
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
            <option value="MIX_MASTER">MIX_MASTER</option>
            <option value="PRODUCTION">PRODUCTION</option>
            <option value="COMPOSITION">COMPOSITION</option>
            <option value="SOUND_DESIGN">SOUND_DESIGN</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</label>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Precio desde</label>
          <input value={priceFrom} onChange={(event) => setPriceFrom(event.target.value)} inputMode="numeric" className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Precio hasta</label>
          <input value={priceTo} onChange={(event) => setPriceTo(event.target.value)} inputMode="numeric" className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Moneda</label>
          <select value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CLP">CLP</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Turnaround (días)</label>
          <input value={turnaroundDays} onChange={(event) => setTurnaroundDays(event.target.value)} inputMode="numeric" className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Orden</label>
          <input value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} inputMode="numeric" className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destacado</label>
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="h-4 w-4 rounded border-border" />
            Featured
          </label>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción</label>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
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
