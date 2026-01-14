// src/components/admin/track/DeleteTrackButton.client.tsx
/**
 * Botón de eliminación de track (admin).
 *
 * Peras y manzanas:
 * - Muestra un botón rojo "Eliminar" en el header de /admin/track/[id]/edit.
 * - Al hacer click:
 *     • Abre un modal de confirmación.
 *     • Dentro del modal hay un <form> que ejecuta una Server Action
 *       recibida por props (deleteAction).
 * - La Server Action:
 *     • Elimina el track de la base de datos.
 *     • Redirige a /admin/tracks.
 *
 * Notas:
 * - NO toca la lógica de análisis, waveform ni nada técnico de audio.
 * - Por ahora sólo se borra de BD; assetKey/coverUrl viajan en el form
 *   para futuro hookeo con R2/S3 sin cambiar este componente.
 */

"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

type DeleteAction = (formData: FormData) => Promise<void>;

type DeleteTrackButtonProps = {
  trackId: string;
  trackTitle?: string | null;
  deleteAction: DeleteAction;
  assetKey?: string | null;
  coverUrl?: string | null;
};

/**
 * Botón de submit dentro del <form> del modal.
 * Usa useFormStatus para reflejar el estado "Eliminando…".
 */
function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center justify-center rounded-md border border-red-700 bg-red-900 px-3 text-xs font-medium text-red-50 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Eliminando…" : "Eliminar definitivamente"}
    </button>
  );
}

export function DeleteTrackButton({
  trackId,
  trackTitle,
  deleteAction,
  assetKey,
  coverUrl,
}: DeleteTrackButtonProps) {
  const [open, setOpen] = React.useState(false);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      {/* Botón rojo principal del header */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-8 items-center justify-center rounded-md border border-red-700 bg-red-950 px-3 text-xs font-medium text-red-100 hover:bg-red-900"
      >
        Eliminar
      </button>

      {/* Modal de confirmación */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-red-800 bg-zinc-950/95 p-4 text-sm text-zinc-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-red-200">
              Confirmar eliminación
            </h2>
            <p className="mt-2 text-xs text-zinc-300">
              Vas a eliminar este track de forma permanente de la base de datos.
              Esta acción no se puede deshacer.
            </p>
            {trackTitle && (
              <p className="mt-1 text-[11px] text-zinc-500">
                Track:{" "}
                <span className="font-medium text-zinc-200">
                  {trackTitle}
                </span>
              </p>
            )}

            <p className="mt-3 text-[11px] text-zinc-500">
              Nota: en esta etapa del proyecto se asume la eliminación lógica
              en el catálogo (BD). Más adelante se puede conectar la misma
              acción con el borrado físico en R2/S3 usando{" "}
              <code className="font-mono">assetKey</code> /
              <code className="font-mono">coverUrl</code>.
            </p>

            {/* Formulario que ejecuta la Server Action */}
            <form
              action={deleteAction}
              className="mt-4 flex items-center justify-end gap-2"
            >
              {/* ID del track (para la Server Action) */}
              <input type="hidden" name="id" value={trackId} />
              {/* Asset info (guardada para futuro uso con R2/S3) */}
              <input type="hidden" name="assetKey" value={assetKey ?? ""} />
              <input type="hidden" name="coverUrl" value={coverUrl ?? ""} />

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Cancelar
              </button>

              <DeleteSubmitButton />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
