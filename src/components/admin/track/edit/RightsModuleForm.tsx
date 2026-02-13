"use client";

import * as React from "react";

import { updateRights } from "@/app/admin/track/actions/rights";
import RightsFormClient from "@/components/admin/track/RightsFormClient";
import { ModuleSaveBar } from "@/components/admin/track/edit/ModuleSaveBar";

type UpdateRightsResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function RightsModuleForm({
  trackId,
  track,
}: {
  trackId: string;
  track: {
    mfn: boolean;
    contentIdEnrolled: boolean;
    contentIdAdmin: string;
    contentIdWhitelist: string;
    master: string;
    oneStop: boolean;
    clearedForSync: boolean;
    publishingShares: Array<{
      id?: string;
      role: "WRITER" | "PUBLISHER";
      name: string;
      sharePct: number | null;
      ipiNumber?: string | null;
      pro?: string | null;
      caeNumber?: string | null;
      sortOrder?: number | null;
    }>;
    masterShares: Array<{
      id?: string;
      name: string;
      sharePct: number | null;
      contact?: string | null;
      notes?: string | null;
      sortOrder?: number | null;
    }>;
    restrictions?: string[] | null;
  };
}) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<UpdateRightsResult | null>(null);
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
      const result = await updateRights(formData);
      setStatus(result);
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("[RightsModuleForm] handleSubmit error:", error);
      setStatus({
        ok: false,
        message: "Error al guardar modulo de derechos.",
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
      <input type="hidden" name="id" value={trackId} />

      <div className="space-y-4">
        <RightsFormClient
          trackId={trackId}
          track={track}
          fieldErrors={fieldErrors}
        />
      </div>

      <ModuleSaveBar
        status={status}
        hint="Guarda toggles y metadatos de derechos de este modulo."
        pending={pending}
        submitLabel="Guardar derechos"
      />
    </form>
  );
}
