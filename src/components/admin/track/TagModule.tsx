"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";

type TagModuleProps = {
  title: string;
  description?: React.ReactNode;
  selected: TagChip[];
  onChange: (chips: TagChip[]) => void;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
  saveLabel?: string;
  placeholder?: string;
  headingAssigned?: string;
  headingSuggestions?: string;
  maxItems?: number;
  fetchSuggestions?: (q: string) => Promise<TagChip[]>;
  fetchAll?: () => Promise<TagChip[]>;
  normalize?: (raw: string) => TagChip | null;
  allowCreate?: boolean;
  onCreate?: (label: string) => Promise<TagChip | null> | TagChip | null;
  allowDeleteCatalog?: boolean;
  onDeleteCatalog?: (chip: TagChip) => Promise<boolean | void> | boolean | void;
  deleteConfirmText?: string;
  initialCatalogItems?: TagChip[];
  children?: React.ReactNode;
};

export function TagModule({
  title,
  description,
  selected,
  onChange,
  onSave,
  saving,
  saveLabel = "Guardar",
  placeholder,
  headingAssigned,
  headingSuggestions,
  maxItems,
  fetchSuggestions,
  fetchAll,
  normalize,
  allowCreate,
  onCreate,
  allowDeleteCatalog,
  onDeleteCatalog,
  deleteConfirmText,
  initialCatalogItems,
  children,
}: TagModuleProps) {
  return (
    <section className="space-y-2 rounded-lg border border-border/70 bg-card/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          ) : null}
        </div>
        {onSave ? (
          <button
            type="button"
            onClick={() => onSave()}
            disabled={saving}
            className="h-8 px-3 border border-current justify-center items-center text-foreground bg-transparent hover:bg-foreground/10 dark:hover:bg-foreground/15 transition-colors inline-flex text-xs font-semibold rounded-md"
          >
            {saving ? "Guardando…" : saveLabel}
          </button>
        ) : null}
      </div>

      <TagChips
        selected={selected}
        onChange={onChange}
        placeholder={placeholder}
        maxItems={maxItems}
        headingAssigned={headingAssigned}
        headingSuggestions={headingSuggestions}
        fetchSuggestions={fetchSuggestions}
        fetchAll={fetchAll}
        normalize={normalize}
        allowCreate={allowCreate}
        onCreate={onCreate}
        allowDeleteCatalog={allowDeleteCatalog}
        onDeleteCatalog={onDeleteCatalog}
        deleteConfirmText={deleteConfirmText}
        initialCatalogItems={initialCatalogItems}
      />
      {children}
    </section>
  );
}

export default TagModule;
