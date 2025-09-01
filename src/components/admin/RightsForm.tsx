/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/admin/RightsForm.tsx                                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Client Component que pinta el formulario y ejecuta la Server Action.      │
 * │ - Muestra `restrictions` como textarea con 1 restricción por línea (o comas)│
 * │ - El submit deja que el servidor coaccione tipos y haga redirect ?saved=1.  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - No “adivinamos” tipos en el cliente. Enviamos crudo y el server decide.   │
 * │ - Si luego cambias checkboxes por selects yes/no, el server igual convierte.│
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import * as React from "react";

type TrackRights = {
  id: string;
  licenseType: string | null;
  territories: string | null;
  term: string | null;
  mediaBuy: string | null;
  mfn: boolean;
  restrictions: string[]; // array real en BD
  contentIdEnrolled: boolean;
  contentIdAdmin: boolean;
  contentIdWhitelist: boolean;
  master: boolean;
  publishingSplit: Record<string, number> | null;
};

export default function RightsForm({
  track,
  updateRights,
}: {
  track: TrackRights;
  updateRights: (formData: FormData) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateRights(formData); // Server hará redirect ?saved=1
    } catch (err) {
      console.error("[rights] submit error", err);
      setIsSaving(false);
      alert("Ocurrió un error guardando. Revisa la consola del servidor.");
    }
  }

  const restrictionsText = (track.restrictions ?? []).join("\n");

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border border-gray-200 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Tipo licencia</label>
          <input
            name="licenseType"
            defaultValue={track.licenseType ?? ""}
            placeholder="one-stop / pre-cleared / etc."
            className="w-full rounded border px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Territorios</label>
          <input
            name="territories"
            defaultValue={track.territories ?? ""}
            placeholder="Chile, LatAm, Worldwide…"
            className="w-full rounded border px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Plazo (term)</label>
          <input
            name="term"
            defaultValue={track.term ?? ""}
            placeholder="1 año, perpetuo…"
            className="w-full rounded border px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Media Buy (texto)</label>
          <input
            name="mediaBuy"
            defaultValue={track.mediaBuy ?? ""}
            placeholder="yes/no o texto libre"
            className="w-full rounded border px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="mfn" defaultChecked={track.mfn} />
          <label className="text-sm">MFN (Most Favored Nation)</label>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-500">Restricciones</label>
          <textarea
            name="restrictions"
            defaultValue={restrictionsText}
            rows={4}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder={"Una por línea, por ejemplo:\nNo campañas políticas\nNo tabaco/armas"}
          />
          <p className="mt-1 text-xs text-gray-500">
            Puedes separarlas por <strong>línea</strong> o por <strong>coma</strong>. Se guardan como lista (array) en BD.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="contentIdEnrolled" defaultChecked={track.contentIdEnrolled} />
          <label className="text-sm">ContentID inscrito</label>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="contentIdAdmin" defaultChecked={track.contentIdAdmin} />
          <label className="text-sm">ContentID administrado</label>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="contentIdWhitelist" defaultChecked={track.contentIdWhitelist} />
          <label className="text-sm">Whitelist activos</label>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="master" defaultChecked={track.master} />
          <label className="text-sm">Master controlado</label>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-500">Publishing Split (JSON)</label>
          <textarea
            name="publishingSplit"
            defaultValue={track.publishingSplit ? JSON.stringify(track.publishingSplit, null, 2) : ""}
            rows={6}
            className="w-full rounded border px-3 py-2 font-mono text-xs"
            placeholder='{"Writer A": 50, "Writer B": 50}'
          />
          <p className="mt-1 text-xs text-gray-500">
            Deja vacío para <code>null</code>. Si el JSON es inválido, lo ignoramos y guardamos <code>null</code>.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isSaving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
