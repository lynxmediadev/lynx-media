// src/components/admin/track/CreativeForm.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";

type FieldErrors = Record<string, string[]>;

type CreativeActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrors;
};

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
    moods: string[];
    uses: string[];
    updatedAt: Date;
  };
  updateCreative: (formData: FormData) => Promise<CreativeActionResult>;
};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
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

  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<CreativeActionResult | null>(null);

  // ⬇⬇⬇ NUEVO: estado de errores en el cliente ⬇⬇⬇
  const [clientErrors, setClientErrors] = React.useState<ClientErrors>({});

  const fieldErrors: FieldErrors = status?.fieldErrors ?? {};

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
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    if (!["title", "artist", "moods", "uses"].includes(name)) return;

    const error = validateField(name as keyof ClientErrors, value);
    setClientErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }

  // Se dispara al escribir (onChange) para ir limpiando el error en vivo
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    if (!["title", "artist", "moods", "uses"].includes(name)) return;

    const error = validateField(name as keyof ClientErrors, value);
    setClientErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }

  async function handleAction(formData: FormData) {
    setPending(true);
    setStatus(null);

    try {
      const result = await updateCreative(formData);
      console.log("[CreativeForm] result", result);
      setStatus(result);

      // Si se guardó bien en el server, limpiamos errores cliente
      if (result.ok) {
        setClientErrors({});
      }
    } catch (err) {
      console.error("[CreativeForm] handleAction error", err);
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
          <h2 className="text-base font-semibold text-zinc-50">Creativo</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Título, artista y descriptores (moods / usos) para búsquedas
            rápidas.
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

      {/* Fila: Título + Artista */}
      <div className="grid gap-2 md:grid-cols-2">
        <FormField
          htmlFor="title"
          label={"Título"}
          descriptionPosition="below"
          description={<>Nombre interno y/o comercial del track.</>}
          error={clientErrors.title ?? fieldErrors.title?.[0] ?? null}
        >
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={track.title ?? ""}
            onBlur={handleBlur}
            className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            placeholder="Nombre del track"
          />
        </FormField>

        <FormField
          htmlFor="artist"
          error={clientErrors.artist ?? fieldErrors.artist?.[0] ?? null}
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
            onBlur={handleBlur}
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
          error={clientErrors.moods ?? fieldErrors.moods?.[0] ?? null}
        >
          <textarea
            id="moods"
            name="moods"
            defaultValue={moodsDefault}
            onBlur={handleBlur}
            rows={5}
            className="w-full resize-y rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            placeholder={`SAD\nDARK\nEMOTIONAL\nHOPENESS\nSUSPENSE`}
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
          error={clientErrors.uses ?? fieldErrors.uses?.[0] ?? null}
        >
          <textarea
            id="uses"
            name="uses"
            defaultValue={usesDefault}
            onBlur={handleBlur}
            rows={5}
            className="w-full resize-y rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            placeholder={`TRAILER\nSERIE\nDOCUMENTAL\nPUBLICIDAD\nVIDEO GAME`}
          />
        </FormField>
      </div>
    </form>
  );
}
