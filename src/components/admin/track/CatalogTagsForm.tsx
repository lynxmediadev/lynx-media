"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createCatalogTag } from "@/app/admin/track/actions/create-catalog-tag";
import { deleteCatalogTag } from "@/app/admin/track/actions/delete-catalog-tag";
import { updateCatalogTags } from "@/app/admin/track/actions/update-catalog-tags";

type Option = {
  id: string;
  slug: string;
  name: string;
};

type Props = {
  trackId: string;
  options: Option[];
  selectedSlugs: string[];
  fieldErrors: Record<string, string[]>;
};

export function CatalogTagsForm({ trackId, options, selectedSlugs, fieldErrors }: Props) {
  const [localOptions, setLocalOptions] = React.useState<Option[]>(options);
  const [selected, setSelected] = React.useState<string[]>(selectedSlugs);
  const [newName, setNewName] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [pendingSave, setPendingSave] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [deleteInput, setDeleteInput] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTarget, setConfirmTarget] = React.useState<Option | null>(null);

  React.useEffect(() => {
    setLocalOptions(options);
    setSelected(selectedSlugs);
  }, [options, selectedSlugs]);

  if (!localOptions.length) {
    return (
      <div className="rounded border border-border bg-card/70 p-3 text-sm text-muted-foreground">
        No hay tags de catálogo configurados. Usa el seed o agrega BEATS/SYNC en Prisma.
      </div>
    );
  }

  const sortByName = (list: Option[]) =>
    [...list].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  const assigned = sortByName(localOptions.filter((o) => selected.includes(o.slug)));
  const unassigned = sortByName(localOptions.filter((o) => !selected.includes(o.slug)));

  const toggle = (slug: string) => {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    setSelected(next);
    setPendingSave(true);
    setFormError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const result = await updateCatalogTags({ trackId, slugs: next });
      if (!result?.ok) {
        setFormError(result?.message ?? "Error al guardar tags");
        // revert
        setSelected(selected);
      } else {
        setSuccessMsg("Guardado");
      }
      setPendingSave(false);
    });
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      setFormError("Ingresa un nombre.");
      setSuccessMsg(null);
      return;
    }
    setFormError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const result = await createCatalogTag({
        trackId,
        name: newName.trim(),
      });
      if (result?.ok && result.tag) {
        setLocalOptions((prev) => {
          const exists = prev.some((o) => o.slug === result.tag.slug);
          if (exists) return prev;
          return [...prev, { id: result.tag.id, slug: result.tag.slug, name: result.tag.name }];
        });
        setNewName("");
        setSuccessMsg(`Categoría "${result.tag.name.toUpperCase()}" añadida`);
      } else if (result && "error" in result) {
        setFormError(result.error ? String(result.error) : "Error al crear categoría");
      }
    });
  };

  const openConfirmForSlug = () => {
    const slug = deleteInput.trim().toLowerCase();
    const match = localOptions.find((o) => o.slug === slug);
    if (!match) {
      setFormError("No se encontró una categoría con ese slug.");
      setSuccessMsg(null);
      return;
    }
    setConfirmTarget(match);
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          Categorías de catálogo (filtros públicos)
        </h3>
        {pendingSave ? (
          <Badge variant="outline" className="text-[11px]">
            Guardando…
          </Badge>
        ) : null}
        {selected.length > 0 ? (
          <Badge variant="secondary" className="text-[11px]">
            {selected.length} activo(s)
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            Si no asignas, el track no aparece en filtros públicos.
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Click para asignar o quitar. Estas categorías alimentan el filtro público de /catalog.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2 rounded border border-border bg-card/60 p-3" role="list" aria-label="Tags asignados">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tags asignados
          </div>
          {assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin asignar.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assigned.map((opt) => {
                const showSlug = opt.slug.toLowerCase() !== opt.name.toLowerCase();
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.slug)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-border bg-foreground text-background px-3 py-1 text-xs font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                    aria-pressed={true}
                    role="listitem"
                    title="Click para quitar"
                  >
                    {opt.name}
                    {showSlug ? <span className="text-[10px] uppercase opacity-80">{opt.slug}</span> : null}
                    <span className="text-[10px] opacity-80">×</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded border border-border bg-card/60 p-3" role="list" aria-label="Tags disponibles">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tags disponibles
          </div>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay más categorías.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unassigned.map((opt) => {
                const showSlug = opt.slug.toLowerCase() !== opt.name.toLowerCase();
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.slug)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition hover:border-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                    aria-pressed={false}
                    role="listitem"
                    title="Click para asignar"
                  >
                    {opt.name}
                    {showSlug ? <span className="text-[10px] uppercase text-muted-foreground">{opt.slug}</span> : null}
                    <span className="text-[10px] text-muted-foreground">+</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded border border-border/70 bg-card/60 px-3 py-3">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Añade una nueva categoría de catálogo (CATALOG). Se usará como filtro público en /catalog y aparecerá en esta lista automáticamente.
            </p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <input
                type="text"
                name="newCatalogName"
                placeholder="Ej: LOFI"
                value={newName}
                onChange={(e) => setNewName(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (pending) return;
                    handleAdd();
                  }
                }}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
                disabled={pending}
              />
              <button
                type="button"
                onClick={() => handleAdd()}
                disabled={pending}
                className="inline-flex items-center justify-center rounded border border-border bg-card px-3 py-1 text-sm font-medium text-foreground transition hover:border-foreground/60 disabled:opacity-60"
              >
                {pending ? "Guardando..." : "Agregar"}
              </button>
            </div>
            {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
            {successMsg ? <p className="text-xs text-emerald-400">{successMsg}</p> : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Para eliminar una categoría, escribe el <strong>slug exacto</strong> (minúsculas, sin espacios) y confirma. Esto la quitará del filtro público.
            </p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <input
                type="text"
                name="deleteCatalogSlug"
              placeholder="ej: BEATS, SYNC, GAMES"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!deleteInput.trim() || pendingDelete) return;
                    openConfirmForSlug();
                  }
                }}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
                disabled={pendingDelete}
              />
              <button
                type="button"
                disabled={pendingDelete || !deleteInput.trim()}
                onClick={() => openConfirmForSlug()}
                className="inline-flex items-center justify-center rounded border border-destructive bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-60"
              >
                {pendingDelete ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {fieldErrors.catalogTags && fieldErrors.catalogTags.length > 0 ? (
        <p className="text-xs text-destructive">
          {fieldErrors.catalogTags.join(", ")}
        </p>
      ) : null}

      {/* Hidden inputs para enviar el estado actual en el formulario principal */}
      {selected.map((slug) => (
        <input key={slug} type="hidden" name="catalogTags" value={slug} />
      ))}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              Esta acción quitará la categoría del catálogo público y la desasignará del track.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border/70 bg-background px-3 py-2 text-sm">
            {confirmTarget ? (
              <>
                <div className="font-semibold">{confirmTarget.name}</div>
                <div className="text-xs text-muted-foreground">slug: {confirmTarget.slug}</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Sin categoría seleccionada.</div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex items-center justify-center rounded border border-border bg-card px-3 py-1 text-sm font-medium text-foreground transition hover:border-foreground/60"
              disabled={pendingDelete}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendingDelete || !confirmTarget}
              onClick={() => {
                if (!confirmTarget) return;
                setPendingDelete(true);
                setFormError(null);
                setSuccessMsg(null);
                startTransition(async () => {
                  const result = await deleteCatalogTag({ id: confirmTarget.id, trackId });
                  if (result?.ok) {
                    setLocalOptions((prev) => prev.filter((o) => o.id !== confirmTarget.id));
                    setSelected((prev) => prev.filter((s) => s !== confirmTarget.slug));
                    setSuccessMsg(`Categoría "${confirmTarget.name}" eliminada`);
                    setDeleteInput("");
                    setConfirmTarget(null);
                    setConfirmOpen(false);
                  } else if (result?.message) {
                    setFormError(result.message);
                  }
                  setPendingDelete(false);
                });
              }}
              className="inline-flex items-center justify-center rounded border border-destructive bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-60"
            >
              {pendingDelete ? "Eliminando..." : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
