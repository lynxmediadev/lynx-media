/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/admin/IdsForm.tsx                                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Formulario cliente para editar ISRC / ISWC / UPC.                         │
 * │ - Llama al Server Action y muestra el resultado (ok/error).                 │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Endurecido: si la action no retorna objeto, no crashea el cliente.        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import * as React from "react";

type TrackIds = {
  id: string;
  title: string | null;
  artist: string | null;
  isrc: string | null;
  iswc: string | null;
  upc: string | null;
  updatedAt: Date | string | null;
};

export default function IdsForm({
  track,
  updateIds,
}: {
  track: TrackIds;
  updateIds: (fd: FormData) => Promise<{ ok: boolean; message: string } | void>;
}) {
  const [msg, setMsg] = React.useState<string | null>(null);
  const [isSaving, setSaving] = React.useState(false);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setMsg(null);
    const res = await updateIds(formData);
    setSaving(false);
    setMsg((res as any)?.message ?? "Guardado");
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">ISRC</label>
          <input
            name="isrc"
            defaultValue={track.isrc ?? ""}
            placeholder="p.ej. CLABC2512345"
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Se normaliza en mayúsculas y sin separadores. Deja vacío para borrar (null).
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">ISWC</label>
          <input
            name="iswc"
            defaultValue={track.iswc ?? ""}
            placeholder="p.ej. T-123.456.789-0"
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Se guarda como string simple (upper/trim); vacío → null.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">UPC</label>
          <input
            name="upc"
            defaultValue={track.upc ?? ""}
            placeholder="p.ej. 887654321098"
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            String simple; no se valida estrictamente aquí.
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
