// src/components/admin/track/IdsForm.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";

type FieldErrors = Record<string, string[]>;

type IdsActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrors;
};

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
  updateIds: (formData: FormData) => Promise<IdsActionResult>;
};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Guardando…" : "Guardar IDs"}
    </button>
  );
}

export default function IdsForm({ track, updateIds }: IdsFormProps) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<IdsActionResult | null>(null);
  const fieldErrors: FieldErrors = status?.fieldErrors ?? {};

  async function handleAction(formData: FormData) {
    setPending(true);
    setStatus(null);

    try {
      const result = await updateIds(formData);
      setStatus(result);
    } catch (err) {
      console.error("[IdsForm] handleAction error", err);
      setStatus({
        ok: false,
        message: "Error al guardar.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleAction} className="space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-50">
            Identificadores
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            ISRC / ISWC / UPC para integraciones con distribuidoras y PROs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {status && (
            <p
              className={`text-[11px] ${
                status.ok ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {status.message ?? (status.ok ? "Guardado" : "Error al guardar")}
            </p>
          )}
          <SubmitButton pending={pending} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* ISRC */}
        <FormField
          label="ISRC"
          htmlFor="isrc"
          error={fieldErrors.isrc?.[0] ?? null}
          descriptionPosition="below"
          description={
            <>
              Código de grabación internacional. Se normaliza a mayúsculas y sin
              espacios/guiones.
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
          error={fieldErrors.iswc?.[0] ?? null}
          descriptionPosition="below"
          description={
            <>
              Código de composición (obra). Opcional si aún no se ha registrado
              en una sociedad.
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
          error={fieldErrors.upc?.[0] ?? null}
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
