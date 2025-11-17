// src/components/admin/track/CreativeForm.tsx
"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import FormField from "../ui/FormField";

type CreativeFormProps = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    moods: string[];
    uses: string[];
    updatedAt: Date;
  };
  updateCreative: (
    formData: FormData,
  ) => Promise<{ ok: boolean; message: string }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-sm border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export default function CreativeForm({
  track,
  updateCreative,
}: CreativeFormProps) {
  const moodsDefault = (track.moods ?? []).join("\n");
  const usesDefault = (track.uses ?? []).join("\n");

  return (
    <form action={updateCreative} className="space-y-3">
      <input type="hidden" name="id" value={track.id} />

      {/* Header sección + botón */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-50">Creativo</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Título, artista, moods y usos previstos para descubrimiento y
            filtros.
          </p>
        </div>
        <SubmitButton />
      </div>

      {/* Fila: Título + Artista */}
      <div className="grid gap-2 md:grid-cols-2">
          <FormField
            htmlFor="title"
            label={"Título"}
            descriptionPosition="below"
            description={<>Nombre interno y/o comercial del track.</>}
          >
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={track.title ?? ""}
              className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder="Nombre del track"
            />
          </FormField>

          <FormField
            htmlFor="artist"
            label={"Artista"}
            descriptionPosition="below"
            description={
              <>Alias o nombre artístico visible para el cliente (si aplica).</>
            }
          >
            <input
              id="artist"
              name="artist"
              type="text"
              defaultValue={track.artist ?? ""}
              className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder="Nombre del artista / proyecto"
            />
          </FormField>
      </div>

      {/* Fila: Moods + Usos */}
      <div className="grid gap-2 md:grid-cols-2">
          <FormField
            htmlFor="moods"
            label={"Moods"}
            descriptionPosition="above"
            description={
              <>
                Un mood por línea (o separados por comas). Se normalizan en el
                servidor.
              </>
            }
          >
            <textarea
              id="moods"
              name="moods"
              defaultValue={moodsDefault}
              rows={3}
              className="w-full resize-y rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder={"Ejemplo:\ncinemático\noscuro\norgánico\nsuspenso"}
            />
          </FormField>

          <FormField
            htmlFor="uses"
            label={"Usos previstos"}
            descriptionPosition="above"
            description={
              <>
                Un uso por línea (o separados por comas). Ayudan a filtrar por
                tipo de proyecto.
              </>
            }
          >
            <textarea
              id="uses"
              name="uses"
              defaultValue={usesDefault}
              rows={3}
              className="w-full resize-y rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder={
                "Ejemplo:\ntráiler\nserie TV\npublicidad digital\nvideojuego"
              }
            />
          </FormField>
      </div>
    </form>
  );
}
