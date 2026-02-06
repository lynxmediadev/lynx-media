// src/components/admin/track/CreativeForm.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import { Input } from "@/components/ui/input";
import { MoodChips } from "./MoodChips";
import UseChips from "./UseChips";
import CategoryChips from "./CategoryChips";

type FieldErrors = Record<string, string[]>;

type ClientErrors = {
  title?: string | null;
  artist?: string | null;
  moods?: string | null;
  uses?: string | null;
};

type CreativeFormProps = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    assignedMoods: string[];
    assignedUses: string[];
    assignedCategories: Array<{ id?: string; slug?: string; name: string }>;
  };
  fieldErrors?: FieldErrors;
  moodCatalog: { id: string; slug: string; name: string }[];
  useCatalog: { id: string; slug: string; name: string }[];
  categoryCatalog: { id: string; slug: string; name: string }[];
  categoryError?: string | null;
};

export default function CreativeForm({
  track,
  fieldErrors,
  moodCatalog,
  useCatalog,
  categoryCatalog,
  categoryError,
}: CreativeFormProps) {
  const serverErrors: FieldErrors = fieldErrors ?? {};

  // ⬇⬇⬇ NUEVO: estado de errores en el cliente ⬇⬇⬇
  const [clientErrors, setClientErrors] = React.useState<ClientErrors>({});

  // Validación simple lado cliente (mismas reglas que Zod, pero en front)
  function validateField(
    name: keyof ClientErrors,
    value: string,
  ): string | null {
    const trimmed = value.trim();

    if (name === "title" && trimmed.length === 0) {
      return "El título es obligatorio.";
    }

    if (name === "artist" && trimmed.length === 0) {
      return "El artista / proyecto es obligatorio.";
    }

    // if (name === "moods" && trimmed.length === 0) {
    //   return "Debes ingresar al menos un mood.";
    // }

    // if (name === "uses" && trimmed.length === 0) {
    //   return "Debes ingresar al menos un uso recomendado.";
    // }

    return null;
  }

  // Se dispara al salir del campo (onBlur)
  function handleBlur(
    e: React.FocusEvent<HTMLInputElement>,
  ) {
    const { name, value } = e.target;
    if (!["title", "artist", "moods", "uses"].includes(name)) return;

    const error = validateField(name as keyof ClientErrors, value);
    setClientErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }

  return (
    <div className="space-y-3">
      <div className="border-b border-border pb-2">
        <h2 className="text-base font-semibold text-foreground">Creativo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Título, artista y descriptores (moods / usos) para búsquedas rápidas.
        </p>
      </div>

      {/* Fila: Título + Artista */}
      <div className="grid gap-2 md:grid-cols-2">
        <FormField
          htmlFor="title"
          label={"Título"}
          descriptionPosition="below"
          description={<>Nombre interno y/o comercial del track.</>}
          error={clientErrors.title ?? serverErrors.title?.[0] ?? null}
        >
          <Input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={track.title ?? ""}
            onBlur={handleBlur}
            className="w-full text-sm"
            placeholder="Nombre del track"
          />
        </FormField>

        <FormField
          htmlFor="artist"
          error={clientErrors.artist ?? serverErrors.artist?.[0] ?? null}
          label={"Artista"}
          descriptionPosition="below"
          description={
            <>Alias o nombre artístico visible para el cliente (si aplica).</>
          }
        >
          <Input
            id="artist"
            name="artist"
            type="text"
            defaultValue={track.artist ?? ""}
            onBlur={handleBlur}
            className="w-full text-sm"
            placeholder="Nombre del artista / proyecto"
          />
        </FormField>
      </div>

      {/* Sección: Tags (Moods / Usos / Categorías) */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch mb-2">
        <div className="md:col-span-1 h-full">
          <FormField
          htmlFor="moods"
          label={"Moods"}
          descriptionPosition="above"
          description={<>Busca y añade moods del catálogo; puedes proponer uno nuevo si no existe.</>}
          error={clientErrors.moods ?? serverErrors.moods?.[0] ?? null}
          className="h-full flex flex-col"
        >
          <MoodChips
            name="moods"
            initialMoods={track.assignedMoods ?? []}
            initialCatalog={moodCatalog}
            trackId={track.id}
            error={clientErrors.moods ?? serverErrors.moods?.[0] ?? null}
          />
        </FormField>
      </div>

        <div className="md:col-span-1 h-full">
          <FormField
            htmlFor="uses"
            label={"Usos previstos"}
            descriptionPosition="above"
          description={
            <>Usos separados por comas; ayuda a filtrar por tipo de proyecto.</>
          }
          error={clientErrors.uses ?? serverErrors.uses?.[0] ?? null}
          className="h-full flex flex-col"
        >
          <UseChips
            name="uses"
            initialUses={track.assignedUses ?? []}
            initialCatalog={useCatalog}
            trackId={track.id}
            error={clientErrors.uses ?? serverErrors.uses?.[0] ?? null}
            maxItems={15}
          />
        </FormField>
      </div>

        <div className="md:col-span-1 h-full">
          <FormField
            htmlFor="catalogTags"
            label={"Categorías"}
            descriptionPosition="above"
          description={<>Asignar/crear categorías del catálogo (CATALOG).</>}
          error={categoryError ?? null}
          className="h-full flex flex-col"
        >
          <CategoryChips
            trackId={track.id}
            name="catalogTags"
            initialCategories={track.assignedCategories}
            initialCatalog={categoryCatalog}
            error={categoryError ?? null}
            maxItems={10}
          />
        </FormField>
      </div>
      </div>
    </div>
  );
}
