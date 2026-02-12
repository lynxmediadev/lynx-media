"use client";

import * as React from "react";

import { updateRights } from "@/app/admin/track/actions/rights";
import { Button } from "@/components/ui/button";
import RightsFormClient from "@/components/admin/track/RightsFormClient";

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
      className="flex min-h-[calc(100dvh-16rem)] flex-col gap-4"
    >
      <input type="hidden" name="id" value={trackId} />

      <div className="space-y-4">
        <RightsFormClient
          trackId={trackId}
          track={track}
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
            <span>Guarda toggles y metadatos de derechos de este modulo.</span>
          )}
        </p>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={pending}
        >
          {pending ? "Guardando..." : "Guardar derechos"}
        </Button>
      </div>
    </form>
  );
}
