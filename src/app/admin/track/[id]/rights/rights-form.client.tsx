// src/app/admin/track/[id]/rights/rights-form.client.tsx
"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
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
    restrictionsStr: string;   // ← text[] mostrado como líneas
    publishingSplitStr: string;
  };
};

type State = { ok: true } | { ok: false; error?: string } | null;

export default function RightsForm({ track }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => (await updateRights(formData)) as State,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      // Reemplaza estos alert por tu sistema de toasts:
      // toast.success("Guardado 👍");
       
      alert("Guardado 👍");
      router.refresh(); // recarga datos del servidor, URL se mantiene limpia
    } else if (state && !state.ok) {
       
      alert("Ocurrió un error guardando. Revisa la consola del servidor.");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" defaultValue={track.id} />

      <label className="block">
        <span className="text-sm">License Type</span>
        <input name="licenseType" defaultValue={track.licenseType} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm">Territories</span>
        <input name="territories" defaultValue={track.territories} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm">Term</span>
        <input name="term" defaultValue={track.term} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm">Media Buy</span>
        <input name="mediaBuy" defaultValue={track.mediaBuy} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" name="mfn" defaultChecked={track.mfn} className="h-4 w-4" />
        <span className="text-sm">MFN</span>
      </label>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" name="contentIdEnrolled" defaultChecked={track.contentIdEnrolled} className="h-4 w-4" />
        <span className="text-sm">Content ID · Enrolled</span>
      </label>

      <label className="block">
        <span className="text-sm">Content ID · Admin</span>
        <input name="contentIdAdmin" defaultValue={track.contentIdAdmin} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm">Content ID · Whitelist</span>
        <input name="contentIdWhitelist" defaultValue={track.contentIdWhitelist} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm">Master</span>
        <input name="master" defaultValue={track.master} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm">Restrictions (uno por línea o JSON [..])</span>
        <textarea
          name="restrictions"
          defaultValue={track.restrictionsStr}
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
          rows={4}
          placeholder={"No smoke\nNo alcohol"}
        />
      </label>

      <label className="block">
        <span className="text-sm">Publishing Split (JSON)</span>
        <textarea
          name="publishingSplit"
          defaultValue={track.publishingSplitStr}
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
          rows={6}
          placeholder='[{"party":"Composer A","share":50},{"party":"Publisher B","share":50}]'
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
