/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/admin/CreativeForm.tsx                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Client Component del formulario “Creativo”.                               │
 * │ - Usa `defaultValue` para inputs (simple) y recibe una Server Action.       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - En React, `defaultValue` solo se aplica en el 1er montaje.                │
 * │   Por eso el padre (Server Page) le pasa `key` con `updatedAt` para forzar  │
 * │   un remount cuando guardamos y revalidamos (ahí sí toma los nuevos valores).│
 * │ - Endurecido: si la acción no retorna objeto, no crashea el cliente.        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import * as React from "react";

type TrackCreative = {
  id: string;
  title: string | null;
  artist: string | null;
  moods: string[] | null; // según tu esquema puede ser string[] o JSON
  uses: string[] | null;  // idem
  updatedAt: Date | string | null;
};

export default function CreativeForm({
  track,
  updateCreative,
}: {
  track: TrackCreative;
  updateCreative: (fd: FormData) => Promise<{ ok: boolean; message: string } | void>;
}) {
  const [msg, setMsg] = React.useState<string | null>(null);
  const [isSaving, setSaving] = React.useState(false);

  // Mostramos listas como “a, b, c”
  const moodsDefault = Array.isArray(track.moods) ? track.moods.join(", ") : "";
  const usesDefault  = Array.isArray(track.uses)  ? track.uses.join(", ")  : "";

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setMsg(null);
    const res = await updateCreative(formData);
    setSaving(false);
    setMsg((res as any)?.message ?? "Guardado");
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Título</label>
          <input
            name="title"
            defaultValue={track.title ?? ""}
            placeholder="Título de la obra"
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Artista</label>
          <input
            name="artist"
            defaultValue={track.artist ?? ""}
            placeholder="Artista / Proyecto"
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Moods</label>
          <textarea
            name="moods"
            defaultValue={moodsDefault}
            placeholder="Ej: enérgico, feliz, nocturno"
            rows={4}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separa por <strong>coma</strong> o por <strong>línea</strong>. El servidor limpia duplicados/espacios.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Usos</label>
          <textarea
            name="uses"
            defaultValue={usesDefault}
            placeholder="Ej: publicidad, trailer, documental"
            rows={4}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ejemplos: publicidad, TV, social, gaming.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          title="Guardar"
        >
          {isSaving ? "Guardando…" : "Guardar"}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </form>
  );
}
