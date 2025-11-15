// src/app/admin/track/[id]/rights/rights-form.client.tsx
"use client";

/**
 * Formulario de Derechos & Explotación
 *
 * - Edita:
 *   • License Type, Territories, Term, Media Buy
 *   • MFN
 *   • Content ID (enrolled/admin/whitelist)
 *   • Master info
 *   • Restrictions (lista o JSON)
 *   • Publishing Split (JSON)
 *
 * - Envía los datos a la Server Action updateRights(formData).
 * - Al guardar:
 *   • Muestra alert (por ahora; se puede cambiar a toasts).
 *   • Llama a router.refresh() para rehidratar datos desde el servidor.
 *
 * Diseño:
 * - Inputs y textareas con la misma estética que el resto del admin (dark, borde, hover).
 * - Espaciado un poco más comprimido para que la sección sea más legible a nivel macro.
 * - Botón “Guardar cambios” con la misma estética que “Analizar” / “Volver al listado”.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateRights } from "./actions";

type Props = {
  track: {
    id: string;
    licenseType: string;
    territories: string;
    term: string;
    mediaBuy: string;
    mfn: boolean;
    contentIdEnrolled: boolean;
    contentIdAdmin: string;
    contentIdWhitelist: string;
    master: string;
    restrictionsStr: string;
    publishingSplitStr: string;
  };
};

type State = { ok: true } | { ok: false; error?: string } | null;

export default function RightsForm({ track }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = React.useActionState<State, FormData>(
    async (_prev, formData) => (await updateRights(formData)) as State,
    null,
  );

  React.useEffect(() => {
    if (state?.ok) {
      alert("Guardado 👍");
      router.refresh();
    } else if (state && !state.ok) {
      alert("Ocurrió un error guardando. Revisa la consola del servidor.");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" defaultValue={track.id} />

      {/* License Type */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">License Type</span>
        <input
          name="licenseType"
          defaultValue={track.licenseType}
          className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      {/* Territories */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">Territories</span>
        <input
          name="territories"
          defaultValue={track.territories}
          className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      {/* Term */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">Term</span>
        <input
          name="term"
          defaultValue={track.term}
          className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      {/* Media Buy */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">Media Buy</span>
        <input
          name="mediaBuy"
          defaultValue={track.mediaBuy}
          className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      {/* MFN + Content ID Enrolled */}
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-zinc-200">
          <input
            type="checkbox"
            name="mfn"
            defaultChecked={track.mfn}
            className="h-4 w-4 rounded border border-zinc-600 bg-zinc-900 text-zinc-50"
          />
          <span>MFN</span>
        </label>

        <label className="inline-flex items-center gap-2 text-xs text-zinc-200">
          <input
            type="checkbox"
            name="contentIdEnrolled"
            defaultChecked={track.contentIdEnrolled}
            className="h-4 w-4 rounded border border-zinc-600 bg-zinc-900 text-zinc-50"
          />
          <span>Content ID · Enrolled</span>
        </label>
      </div>

      {/* Content ID Admin */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">Content ID · Admin</span>
        <input
          name="contentIdAdmin"
          defaultValue={track.contentIdAdmin}
          className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      {/* Content ID Whitelist */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">Content ID · Whitelist</span>
        <input
          name="contentIdWhitelist"
          defaultValue={track.contentIdWhitelist}
          className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      {/* Master */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">Master</span>
        <input
          name="master"
          defaultValue={track.master}
          className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      {/* Restrictions */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">
          Restrictions (uno por línea o JSON [..])
        </span>
        <textarea
          name="restrictions"
          defaultValue={track.restrictionsStr}
          className="mt-0.5 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          rows={3}
          placeholder={"No smoke\nNo alcohol"}
        />
      </label>

      {/* Publishing Split */}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-200">
          Publishing Split (JSON)
        </span>
        <textarea
          name="publishingSplit"
          defaultValue={track.publishingSplitStr}
          className="mt-0.5 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          rows={4}
          placeholder='[{"party":"Composer A","share":50},{"party":"Publisher B","share":50}]'
        />
      </label>

      <div className="flex items-center justify-end pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
