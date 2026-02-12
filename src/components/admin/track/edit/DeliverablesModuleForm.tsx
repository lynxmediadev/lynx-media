"use client";

import * as React from "react";

import { updateDeliverables } from "@/app/admin/track/actions/metadata";
import DeliverablesForm from "@/components/admin/track/DeliverablesForm";
import { Button } from "@/components/ui/button";

type UpdateDeliverablesResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function DeliverablesModuleForm({
  track,
}: {
  track: {
    id: string;
    versions: Array<{
      label: string;
      durationSec: number | null;
      kind: string | null;
      sortOrder: number | null;
    }>;
    stems: Array<{
      name: string;
      group: string | null;
      durationSec: number | null;
      sortOrder: number | null;
    }>;
  };
}) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<UpdateDeliverablesResult | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>(
    {},
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateDeliverables(formData);
      setStatus(result);
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("[DeliverablesModuleForm] handleSubmit error:", error);
      setStatus({
        ok: false,
        message: "Error al guardar modulo Entregables.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[calc(100dvh-16rem)] flex-col gap-4"
    >
      <input type="hidden" name="id" value={track.id} />

      <div className="space-y-4">
        <DeliverablesForm
          track={{
            versions: track.versions,
            stems: track.stems,
          }}
          fieldErrors={fieldErrors}
        />
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-20 mt-auto -mx-4 md:-mx-12 w-auto flex flex-wrap items-center justify-between gap-3 border border-border bg-card/90 px-4 py-2 md:px-12 backdrop-blur">
        <p className="text-xs text-muted-foreground">
          {status ? (
            <span className={status.ok ? "text-success" : "text-destructive"}>
              {status.message}
            </span>
          ) : (
            <span>Guarda versiones y stems del modulo de entregables.</span>
          )}
        </p>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={pending}
        >
          {pending ? "Guardando..." : "Guardar entregables"}
        </Button>
      </div>
    </form>
  );
}
