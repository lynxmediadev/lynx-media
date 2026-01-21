"use client";

import * as React from "react";

import CreativeForm from "./CreativeForm";
import IdsForm from "./IdsForm";
import RightsFormClient from "./RightsFormClient";
import SyncMetaForm from "./SyncMetaForm";
import DeliverablesForm from "./DeliverablesForm";
import { updateTrackAll } from "@/app/admin/track/actions/update-all";
import { Button } from "@/components/ui/button";

type UpdateAllResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

type TrackEditFormProps = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    moods: string[];
    uses: string[];
    isrc: string | null;
    iswc: string | null;
    upc: string | null;

    licenseType: string | null;
    mediaBuy: string | null;
    bpm: number | null;
    key: string | null;
    trackType: string | null;
    genres: string[];
    subgenres: string[];
    exclusiveTerritories: string[];
    exclusiveTermMonths: number | null;
    restrictedTerritories: string[];
    restrictedIndustries: string[];
    restrictedPlatforms: string[];
    restrictedBrands: string[];
    restrictions: string[];
    pricingTier: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    budgetCurrency: string | null;

    mfn: boolean;
    oneStop: boolean;
    clearedForSync: boolean;
    contentIdEnrolled: boolean;
    contentIdAdmin: string | null;
    contentIdWhitelist: string | null;
    master: string | null;

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
  primaryWriter: {
    name: string;
    sharePct: number | null;
    ipiNumber: string | null;
    pro: string | null;
    caeNumber: string | null;
  } | null;
  primaryPublisher: {
    name: string;
    sharePct: number | null;
    ipiNumber: string | null;
    pro: string | null;
    caeNumber: string | null;
  } | null;
};

export default function TrackEditForm({
  track,
  primaryWriter,
  primaryPublisher,
}: TrackEditFormProps) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<UpdateAllResult | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateTrackAll(formData);
      setStatus(result);
      setFieldErrors(result.fieldErrors ?? {});
    } catch (err) {
      console.error("[TrackEditForm] handleSubmit error", err);
      setStatus({
        ok: false,
        message: "Error al guardar los cambios.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="id" defaultValue={track.id} />

      <div className="sticky top-[var(--header-h)] z-40 -mx-4 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {status ? (
              <span
                className={status.ok ? "text-success" : "text-destructive"}
              >
                {status.message}
              </span>
            ) : (
              <span>Guardar todos los cambios desde un solo boton.</span>
            )}
          </div>
          <Button
            type="submit"
            disabled={pending}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            {pending ? "Guardando..." : "Guardar todo"}
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card/80 p-4">
        <h2 className="text-base font-semibold text-foreground">
          Metadata creativa &amp; identificadores
        </h2>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Ajusta contenido creativo (titulo, artista, moods, usos) e
          identificadores industriales (ISRC, ISWC, UPC), junto con los
          derechos de explotacion y publishing, desde un mismo panel.
        </p>

        <div className="rounded-lg border border-border bg-card/90 p-3">
          <CreativeForm
            track={{
              title: track.title,
              artist: track.artist,
              moods: track.moods,
              uses: track.uses,
            }}
            fieldErrors={fieldErrors}
          />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card/90 p-3">
          <IdsForm
            track={{
              isrc: track.isrc,
              iswc: track.iswc,
              upc: track.upc,
            }}
            fieldErrors={fieldErrors}
          />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card/90 p-3">
          <RightsFormClient
            track={{
              mfn: !!track.mfn,
              oneStop: !!track.oneStop,
              clearedForSync: !!track.clearedForSync,
              contentIdEnrolled: !!track.contentIdEnrolled,
              contentIdAdmin: track.contentIdAdmin ?? "",
              contentIdWhitelist: track.contentIdWhitelist ?? "",
              master: track.master ?? "",

              writerName: primaryWriter?.name ?? "",
              writerSharePct: primaryWriter?.sharePct ?? null,
              writerIpiNumber: primaryWriter?.ipiNumber ?? "",
              writerPro: primaryWriter?.pro ?? "",
              writerCaeNumber: primaryWriter?.caeNumber ?? "",

              publisherName: primaryPublisher?.name ?? "",
              publisherSharePct: primaryPublisher?.sharePct ?? null,
              publisherIpiNumber: primaryPublisher?.ipiNumber ?? "",
              publisherPro: primaryPublisher?.pro ?? "",
              publisherCaeNumber: primaryPublisher?.caeNumber ?? "",
            }}
            fieldErrors={fieldErrors}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/80 p-4">
        <h2 className="text-base font-semibold text-foreground">
          Metadata sync &amp; entregables
        </h2>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Define metadata estructurada para sync (licencia base, BPM,
          exclusividad y pricing), junto con versiones y stems disponibles.
        </p>

        <div className="rounded-lg border border-border bg-card/90 p-3">
          <SyncMetaForm
            track={{
              licenseType: track.licenseType,
              mediaBuy: track.mediaBuy,
              bpm: track.bpm,
              key: track.key,
              trackType: track.trackType,
              genres: track.genres,
              subgenres: track.subgenres,
              exclusiveTerritories: track.exclusiveTerritories,
              exclusiveTermMonths: track.exclusiveTermMonths,
              restrictedTerritories: track.restrictedTerritories,
              restrictedIndustries: track.restrictedIndustries,
              restrictedPlatforms: track.restrictedPlatforms,
              restrictedBrands: track.restrictedBrands,
              restrictions: track.restrictions ?? [],
              pricingTier: track.pricingTier,
              budgetMin: track.budgetMin,
              budgetMax: track.budgetMax,
              budgetCurrency: track.budgetCurrency,
            }}
            fieldErrors={fieldErrors}
          />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card/90 p-3">
          <DeliverablesForm
            track={{
              versions: track.versions,
              stems: track.stems,
            }}
            fieldErrors={fieldErrors}
          />
        </div>
      </section>
    </form>
  );
}
