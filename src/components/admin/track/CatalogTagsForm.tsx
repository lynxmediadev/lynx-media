"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Option = {
  id: string;
  slug: string;
  name: string;
};

type Props = {
  options: Option[];
  selectedSlugs: string[];
  fieldErrors: Record<string, string[]>;
};

export function CatalogTagsForm({ options, selectedSlugs, fieldErrors }: Props) {
  if (!options.length) {
    return (
      <div className="rounded border border-border bg-card/70 p-3 text-sm text-muted-foreground">
        No hay tags de catálogo configurados. Usa el seed o agrega BEATS/SYNC en Prisma.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          Catálogos (BEATS / SYNC)
        </h3>
        {selectedSlugs.length > 0 ? (
          <Badge variant="secondary" className="text-[11px]">
            {selectedSlugs.length} activo(s)
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            Si no marcas ninguno, el track no aparece en catálogos públicos.
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const checked = selectedSlugs.includes(opt.slug);
          const showSlug = opt.slug.toLowerCase() !== opt.name.toLowerCase();
          return (
            <label
              key={opt.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded border border-border bg-card px-3 py-2 text-sm transition hover:border-foreground/60",
              )}
            >
              <input
                type="checkbox"
                name="catalogTags"
                value={opt.slug}
                defaultChecked={checked}
                className="h-4 w-4 accent-[var(--lm-accent,theme(colors.indigo.500))]"
              />
              <span className="font-medium text-foreground">{opt.name}</span>
              {showSlug ? (
                <span className="text-[11px] uppercase text-muted-foreground">
                  {opt.slug}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      {fieldErrors.catalogTags && fieldErrors.catalogTags.length > 0 ? (
        <p className="text-xs text-destructive">
          {fieldErrors.catalogTags.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
