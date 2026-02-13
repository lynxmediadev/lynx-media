"use client";

import * as React from "react";

import { updateDeliverables } from "@/app/admin/track/actions/metadata";
import DeliverablesForm from "@/components/admin/track/DeliverablesForm";
import { ModuleSaveBar } from "@/components/admin/track/edit/ModuleSaveBar";

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
      className="flex min-h-0 flex-1 flex-col gap-4"
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

      <ModuleSaveBar
        status={status}
        hint="Guarda versiones y stems del modulo de entregables."
        pending={pending}
        submitLabel="Guardar entregables"
      />
    </form>
  );
}
