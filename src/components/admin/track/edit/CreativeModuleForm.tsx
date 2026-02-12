"use client";

import * as React from "react";

import { updateCreative } from "@/app/admin/track/actions/update-creative";
import { Button } from "@/components/ui/button";
import CreativeForm from "@/components/admin/track/CreativeForm";

type UpdateCreativeResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function CreativeModuleForm({
  track,
  moodCatalog,
  useCatalog,
  categoryCatalog,
}: {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    bpm: number | null;
    key: string | null;
    trackType: string | null;
    genres: string[];
    subgenres: string[];
    assignedMoods: string[];
    assignedUses: string[];
    assignedCategories: Array<{ id?: string; slug?: string; name: string }>;
  };
  moodCatalog: { id: string; slug: string; name: string }[];
  useCatalog: { id: string; slug: string; name: string }[];
  categoryCatalog: { id: string; slug: string; name: string }[];
}) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<UpdateCreativeResult | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>(
    {},
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateCreative(formData);
      setStatus(result);
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("[CreativeModuleForm] handleSubmit error:", error);
      setStatus({
        ok: false,
        message: "Error al guardar modulo creativo.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[calc(100dvh-16rem)] flex-col gap-4"
    >
      <input type="hidden" name="id" value={track.id} />

      <div className="space-y-4">
        <CreativeForm
          track={track}
          fieldErrors={fieldErrors}
          moodCatalog={moodCatalog}
          useCatalog={useCatalog}
          categoryCatalog={categoryCatalog}
          categoryError={fieldErrors.catalogTags?.join(", ")}
        />
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-20 mt-auto -mx-4 md:-mx-12 w-auto flex flex-wrap items-center justify-between gap-3 border border-border bg-card/90 px-4 py-2 md:px-12 backdrop-blur">
        <p className="text-xs text-muted-foreground">
          {status ? (
            <span className={status.ok ? "text-success" : "text-destructive"}>
              {status.message}
            </span>
          ) : (
            <span>Guarda titulo, artista y metadata musical de este modulo.</span>
          )}
        </p>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={pending}
        >
          {pending ? "Guardando..." : "Guardar creativo"}
        </Button>
      </div>
    </form>
  );
}
