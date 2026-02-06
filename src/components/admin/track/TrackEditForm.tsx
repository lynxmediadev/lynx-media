"use client";

import * as React from "react";

import CreativeForm from "./CreativeForm";
import IdsForm from "./IdsForm";
import RightsFormClient from "./RightsFormClient";
import SyncMetaForm from "./SyncMetaForm";
import DeliverablesForm from "./DeliverablesForm";
import { updateTrackAll } from "@/app/admin/track/actions/update-all";
import { Button } from "@/components/ui/button";

/**
 * RESULTADO DE GUARDADO GLOBAL (updateTrackAll)
 * - ok: estado final
 * - message: mensaje para barra inferior
 * - fieldErrors: errores por campo para cada modulo
 */
type UpdateAllResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * INPUT DEL ORQUESTADOR TrackEditForm
 *
 * Input:
 * - track: snapshot completo del track (todos los modulos de edicion)
 * - catalogTagOptions: catalogo base para Módulo de Categorías
 *
 * Output:
 * - Renderiza el formulario completo con guardado unificado.
 */
type TrackEditFormProps = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    // Módulo de Moods: lista de MOODS asignados.
    assignedMoods: string[];
    // Módulo de Uses: lista de USES asignados.
    assignedUses: string[];
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
    // Módulo de MASTER: Lista de MASTERS.
    masterShares: Array<{
      id?: string;
      name: string;
      sharePct: number | null;
      contact?: string | null;
      notes?: string | null;
      sortOrder?: number | null;
    }>;
    // Módulo de WRITERS/PUBLISHERS: Lista de WRITERS/PUBLISHERS.
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
    // Módulo de Categorías: slugs asignados (compat con formulario legacy).
    catalogTags: string[];
    // Módulo de Categorías: Lista de CATEGORÍAS asignadas.
    assignedCategories: Array<{ id: string; slug: string; name: string }>;
  };
  // Módulo de Categorías: catálogo disponible para selector/sugerencias.
  catalogTagOptions: { id: string; slug: string; name: string }[];
};

/**
 * ORQUESTADOR DE MODULOS DEL EDIT TRACK
 *
 * Que hace:
 * - Junta los subformularios por modulo.
 * - Ejecuta guardado global con una sola accion.
 * - Distribuye errores de validacion por campo.
 *
 * Input:
 * - props TrackEditFormProps
 *
 * Output:
 * - JSX del formulario completo.
 */
export default function TrackEditForm({
  track,
  catalogTagOptions,
}: TrackEditFormProps) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<UpdateAllResult | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  /**
   * FUNCION DE ENVIO: handleSubmit
   *
   * Que hace:
   * - Intercepta submit nativo.
   * - Llama server action updateTrackAll.
   * - Actualiza estado de pending, status y fieldErrors.
   *
   * Input:
   * - event: React.FormEvent<HTMLFormElement>
   *
   * Output:
   * - No retorna datos (void), actualiza estado React.
   */
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
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      {/* CAMPO BASE DEL FORMULARIO */}
      <input type="hidden" name="id" defaultValue={track.id} />

      {/* MÓDULO DE GUARDADO GLOBAL */}
      {/* Barra fija inferior: estado + boton Guardar todo */}
      <div
        id="save-bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background"
        style={{ bottom: 0, margin: 0 }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="text-xs text-muted-foreground">
            {status ? (
              <span
                className={status.ok ? "text-success" : "text-destructive"}
              >
                {status.message}
              </span>
            ) : (
              <span>Guardar todos los cambios desde un solo botón.</span>
            )}
          </div>
          <Button
            type="submit"
            disabled={pending}
            variant="outline"
            size="lg"
            className="h-11 px-6 text-xs font-semibold full-sm btn-touch"
          >
            {pending ? "Guardando..." : "Guardar todo"}
          </Button>
        </div>
      </div>

      {/* MÓDULO CREATIVO + IDENTIFICADORES + DERECHOS */}
      <section className="rounded-xl border border-border bg-card/80 p-4">
        <h2 className="text-base font-semibold text-foreground">
          Metadata creativa &amp; identificadores
        </h2>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Ajusta contenido creativo (titulo, artista, moods, usos) e
          identificadores industriales (ISRC, ISWC, UPC), junto con los
          derechos de explotacion y publishing, desde un mismo panel.
        </p>

        {/* Módulo de Moods / Módulo de Uses / Módulo de Categorías */}
        <div className="p-2 border-t border-border/60">
          <CreativeForm
            track={{
              id: track.id,
              title: track.title,
              artist: track.artist,
              // Módulo de Moods
              assignedMoods: track.assignedMoods,
              // Módulo de Uses
              assignedUses: track.assignedUses,
              // Módulo de Categorías
              assignedCategories: track.assignedCategories,
            }}
            fieldErrors={fieldErrors}
            categoryCatalog={catalogTagOptions}
            categoryError={fieldErrors.catalogTags?.join(", ")}
          />
        </div>

        {/* MÓDULO DE IDENTIFICADORES (ISRC/ISWC/UPC) */}
        <div className="mt-2 p-2 border-t border-border/60">
          <IdsForm
            track={{
              isrc: track.isrc,
              iswc: track.iswc,
              upc: track.upc,
            }}
            fieldErrors={fieldErrors}
          />
        </div>

        {/* MÓDULO DE WRITERS/PUBLISHERS/MASTER + derechos */}
        <div className="mt-2 p-2 border-t border-border/60">
          <RightsFormClient
            trackId={track.id}
            track={{
              mfn: !!track.mfn,
              oneStop: !!track.oneStop,
              clearedForSync: !!track.clearedForSync,
              contentIdEnrolled: !!track.contentIdEnrolled,
              contentIdAdmin: track.contentIdAdmin ?? "",
              contentIdWhitelist: track.contentIdWhitelist ?? "",
              master: track.master ?? "",
              masterShares: track.masterShares,
              publishingShares: track.publishingShares,
            }}
            fieldErrors={fieldErrors}
          />
        </div>
      </section>

      {/* MÓDULO SYNC + ENTREGABLES */}
      <section className="rounded-xl border border-border bg-card/80 p-4 mt-6">
        <h2 className="text-base font-semibold text-foreground">
          Metadata sync &amp; entregables
        </h2>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Define metadata estructurada para sync (licencia base, BPM,
          exclusividad y pricing), junto con versiones y stems disponibles.
        </p>

        {/* MÓDULO DE METADATA SYNC */}
        <div className="p-2 border-t border-border/60">
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

        {/* LISTA DE VERSIONES Y LISTA DE STEMS */}
        <div className="mt-2 p-2 border-t border-border/60">
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
