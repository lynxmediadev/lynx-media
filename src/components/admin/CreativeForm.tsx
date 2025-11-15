// src/components/admin/CreativeForm.tsx
"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

type CreativeFormProps = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    moods: string[];
    uses: string[];
    updatedAt: Date;
  };
  updateCreative: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export default function CreativeForm({ track, updateCreative }: CreativeFormProps) {
  const moodsDefault = (track.moods ?? []).join("\n");
  const usesDefault = (track.uses ?? []).join("\n");

  return (
    <form action={updateCreative} className="space-y-3">
      <input type="hidden" name="id" value={track.id} />

      {/* Header sección + botón */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-50">
            Creativo
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Título, artista, moods y usos previstos para descubrimiento y filtros.
          </p>
        </div>
        <SubmitButton />
      </div>

      {/* Fila: Título + Artista */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-xs font-medium text-zinc-200">
            Título
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={track.title ?? ""}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Nombre del track"
          />
          <p className="text-[11px] text-zinc-500">
            Nombre interno y/o comercial del track.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="artist" className="text-xs font-medium text-zinc-200">
            Artista
          </label>
          <input
            id="artist"
            name="artist"
            type="text"
            defaultValue={track.artist ?? ""}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Nombre del artista / proyecto"
          />
          <p className="text-[11px] text-zinc-500">
            Alias o nombre artístico visible para el cliente (si aplica).
          </p>
        </div>
      </div>

      {/* Fila: Moods + Usos */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="moods" className="text-xs font-medium text-zinc-200">
            Moods
          </label>
          <textarea
            id="moods"
            name="moods"
            defaultValue={moodsDefault}
            rows={3}
            className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder={"Ejemplo:\ncinemático\noscuro\norgánico\nsuspenso"}
          />
          <p className="text-[11px] text-zinc-500">
            Un mood por línea (o separados por comas). Se normalizan en el servidor.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="uses" className="text-xs font-medium text-zinc-200">
            Usos previstos
          </label>
          <textarea
            id="uses"
            name="uses"
            defaultValue={usesDefault}
            rows={3}
            className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder={"Ejemplo:\ntráiler\nserie TV\npublicidad digital\nvideojuego"}
          />
          <p className="text-[11px] text-zinc-500">
            Un uso por línea (o separados por comas). Ayudan a filtrar por tipo de proyecto.
          </p>
        </div>
      </div>
    </form>
  );
}
