// src/components/admin/track/IdsForm.tsx
"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import FormField from "../ui/FormField";

type IdsFormProps = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    isrc: string | null;
    iswc: string | null;
    upc: string | null;
    updatedAt: Date;
  };
  updateIds: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
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

export default function IdsForm({ track, updateIds }: IdsFormProps) {
  return (
    <form action={updateIds} className="space-y-3">
      <input type="hidden" name="id" value={track.id} />

      {/* Header sección + botón */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-50">
            Identificadores
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            ISRC / ISWC / UPC. Se normalizan en el servidor (mayúsculas, trim,
            vacío → null).
          </p>
        </div>
        <SubmitButton />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* ISRC */}
          <FormField
            label="ISRC"
            htmlFor="isrc"
            descriptionPosition="below"
            description={
              <>
                Código de grabación internacional. Se normaliza a mayúsculas y
                sin espacios/guiones.
              </>
            }
          >
            <input
              id="isrc"
              name="isrc"
              type="text"
              defaultValue={track.isrc ?? ""}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder="CL-XXX-24-00001"
            />
          </FormField>

        {/* ISWC */}
          <FormField
            label="ISWC"
            htmlFor="iswc"
            descriptionPosition="below"
            description={
              <>
                Código de composición (obra). Opcional si aún no se ha
                registrado en una sociedad.
              </>
            }
          >
            <input
              id="iswc"
              name="iswc"
              type="text"
              defaultValue={track.iswc ?? ""}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder="T-123.456.789-Z"
            />
          </FormField>

        {/* UPC */}
          <FormField
            label="UPC / EAN"
            htmlFor="upc"
            descriptionPosition="below"
            description={
              <>Identificador del producto (álbum / single) si aplica.</>
            }
          >
            <input
              id="upc"
              name="upc"
              type="text"
              defaultValue={track.upc ?? ""}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder="123456789012"
            />
          </FormField>
      </div>
    </form>
  );
}
