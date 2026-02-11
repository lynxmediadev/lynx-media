// src/components/admin/track/DeleteTrackButton.client.tsx
/**
 * Botón de eliminación de track (admin).
 *
 * Peras y manzanas:
 * - Muestra un botón rojo "Eliminar" en el header de /admin/tracks/[id]/edit.
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

import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <Button
      type="submit"
      disabled={pending}
      variant="destructive"
      size="sm"
      className="h-8"
    >
      {pending ? "Eliminando..." : "Eliminar definitivamente"}
    </Button>
  );
}

export function DeleteTrackButton({
  trackId,
  trackTitle,
  deleteAction,
  assetKey,
  coverUrl,
}: DeleteTrackButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-8"
        >
          Eliminar
        </Button>
      </DialogTrigger>

      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Confirmar eliminacion
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Vas a eliminar este track de forma permanente de la base de datos.
            Esta accion no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {trackTitle && (
          <p className="text-[11px] text-muted-foreground">
            Track:{" "}
            <span className="font-medium text-foreground">{trackTitle}</span>
          </p>
        )}

        <p className="text-[11px] text-muted-foreground">
          Nota: en esta etapa del proyecto se asume la eliminacion logica en el
          catalogo (BD). Mas adelante se puede conectar la misma accion con el
          borrado fisico en R2/S3 usando{" "}
          <code className="font-mono">assetKey</code> /
          <code className="font-mono">coverUrl</code>.
        </p>

        <form action={deleteAction} className="flex items-center justify-end">
          <input type="hidden" name="id" value={trackId} />
          <input type="hidden" name="assetKey" value={assetKey ?? ""} />
          <input type="hidden" name="coverUrl" value={coverUrl ?? ""} />

          <DialogFooter className="mt-4 w-full">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Cancelar
              </Button>
            </DialogClose>
            <DeleteSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
