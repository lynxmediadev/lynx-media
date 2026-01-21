// src/components/admin/track/RightsFormClient.tsx
/**
 * Formulario reutilizable de "Derechos & explotación" (admin).
 *
 * Peras y manzanas:
 * - Se usa en:
 *     • /admin/track/[id]/edit
 * - Dibuja la sección completa:
 *     • Header con título + descripción
 *     • Bloque único (2 columnas):
 *         - Columna izquierda: "Master & publishing"
 *         - Columna derecha: "Content ID & administración"
 *
 * Notas:
 * - Los nombres de los campos (`name="..."`) se mantienen para no romper nada.
 * - El guardado se centraliza en un solo botón de la página.
 */

"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type RightsTrackFormProps = {
  track: {
    mfn: boolean;
    contentIdEnrolled: boolean;
    contentIdAdmin: string;
    contentIdWhitelist: string;
    master: string;
    oneStop: boolean;
    clearedForSync: boolean;

    // PUBLISHING
    // WRITER
    writerName: string;
    writerSharePct: number | null;
    writerIpiNumber: string;
    writerPro: string;
    writerCaeNumber: string;
    // PUBLISHER
    publisherName: string;
    publisherSharePct: number | null;
    publisherIpiNumber: string;
    publisherPro: string;
    publisherCaeNumber: string;
  };
  fieldErrors?: Record<string, string[]>;
};
type FieldErrors = Record<string, string[]>;

// Helper para leer el primer error de un campo específico
function firstError(fieldErrors: FieldErrors | undefined, key: string) {
  if (!fieldErrors) return null;
  const arr = fieldErrors[key];
  return arr && arr.length > 0 ? arr[0] : null;
}

/**
 * Botón de envío que refleja el estado de guardado.
 */
export default function RightsFormClient({
  track,
  fieldErrors,
}: RightsTrackFormProps) {
  const serverErrors: FieldErrors = fieldErrors ?? {};
  const [mfnChecked, setMfnChecked] = React.useState(track.mfn);
  const [oneStopChecked, setOneStopChecked] = React.useState(track.oneStop);
  const [clearedChecked, setClearedChecked] = React.useState(
    track.clearedForSync,
  );
  const [contentIdChecked, setContentIdChecked] = React.useState(
    track.contentIdEnrolled,
  );

  return (
    <div className="space-y-4">

      {/* HEADER + BOTÓN GUARDAR */}
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Derechos &amp; explotación
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Control de master, publishing y administracion de Content ID.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1 rounded-lg border border-border bg-card/80 p-3">
          <h3 className="text-sm font-semibold text-foreground">
            Master &amp; publishing
          </h3>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Define quien controla el master y como se reparte el publishing
            entre writer y publisher.
          </p>

          {/* Master */}
          <FormField
            htmlFor="master"
            error={firstError(serverErrors, "master")}
            label="Master (titular)"
            descriptionPosition="above"
            description={
              <>
                Ej: <span className="font-mono">Lynx Media 100%</span>,{" "}
                <span className="font-mono">Lynx 50% / Cliente 50%</span>.
              </>
            }
          >
            <Input
              id="master"
              name="master"
              type="text"
              defaultValue={track.master}
              className="mt-0.5 w-full text-xs"
              placeholder="Ej: Lynx Media 100% master ownership"
            />
          </FormField>

          {/* Publishing split */}
          <div className="space-y-2 pt-1">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Publishing split
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Define nombre y porcentaje (entero) para Writer y Publisher.
                  Suma recomendada ≈ 100%.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Columna Writer */}
              <div className="space-y-1 rounded-md border border-border bg-card/70 p-2">
                <p className="text-[11px] font-semibold text-success">
                  Writer
                </p>

                <FormField
                  htmlFor="writerName"
                  error={firstError(serverErrors, "writerName")}
                  label="Nombre / entidad"
                  descriptionPosition="above"
                  description={<></>}
                >
                  <Input
                    id="writerName"
                    name="writerName"
                    type="text"
                    defaultValue={track.writerName}
                    className="w-full text-xs"
                    placeholder="Ej: Diego Fernández (writer)"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  {/* % (entero) */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="writerSharePct"
                      className="text-[11px] text-muted-foreground"
                    >
                      % (entero)
                    </Label>
                    <div className="relative">
                      <Input
                        id="writerSharePct"
                        name="writerSharePct"
                        type="text"
                        defaultValue={
                          track.writerSharePct !== null
                            ? track.writerSharePct
                            : ""
                        }
                        className="w-full pr-6 text-right text-xs"
                        placeholder="50"
                      />
                      {firstError(serverErrors, "writerSharePct") && (
                        <p className="mt-1 text-[11px] text-destructive">
                          {firstError(serverErrors, "writerSharePct")}
                        </p>
                      )}

                      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  {/* IPI Number */}
                  <div className="space-y-1 border-l border-border pl-3">
                    <Label
                      htmlFor="writerIpiNumber"
                      className="text-[11px] text-muted-foreground"
                    >
                      IPI Number
                    </Label>
                    <Input
                      id="writerIpiNumber"
                      name="writerIpiNumber"
                      type="text"
                      defaultValue={track.writerIpiNumber}
                      className="w-full text-xs"
                      placeholder="Ej: 12345678901"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="writerPro"
                      className="text-[11px] text-muted-foreground"
                    >
                      PRO / Sociedad
                    </Label>
                    <Input
                      id="writerPro"
                      name="writerPro"
                      type="text"
                      defaultValue={track.writerPro}
                      className="w-full text-xs"
                      placeholder="Ej: SCD, ASCAP, BMI"
                    />
                  </div>
                  <div className="space-y-1 border-l border-border pl-3">
                    <Label
                      htmlFor="writerCaeNumber"
                      className="text-[11px] text-muted-foreground"
                    >
                      CAE
                    </Label>
                    <Input
                      id="writerCaeNumber"
                      name="writerCaeNumber"
                      type="text"
                      defaultValue={track.writerCaeNumber}
                      className="w-full text-xs"
                      placeholder="Ej: 123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Columna Publisher */}
              <div className="space-y-1 rounded-md border border-border bg-card/70 p-2">
                <p className="text-[11px] font-semibold text-info">
                  Publisher
                </p>

                <FormField
                  htmlFor="publisherName"
                  error={firstError(serverErrors, "publisherName")}
                  label="Nombre / entidad"
                  descriptionPosition="above"
                  description={<></>}
                >
                  <Input
                    id="publisherName"
                    name="publisherName"
                    type="text"
                    defaultValue={track.publisherName}
                    className="w-full text-xs"
                    placeholder="Ej: Lynx Publishing"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  {/* % (entero) */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="publisherSharePct"
                      className="text-[11px] text-muted-foreground"
                    >
                      % (entero)
                    </Label>
                    <div className="relative">
                      <Input
                        id="publisherSharePct"
                        name="publisherSharePct"
                        type="text"
                        defaultValue={
                          track.publisherSharePct !== null
                            ? track.publisherSharePct
                            : ""
                        }
                        className="w-full pr-6 text-right text-xs"
                        placeholder="50"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  {/* IPI Number */}
                  <div className="space-y-1 border-l border-border pl-3">
                    <Label
                      htmlFor="publisherIpiNumber"
                      className="text-[11px] text-muted-foreground"
                    >
                      IPI Number
                    </Label>
                    <Input
                      id="publisherIpiNumber"
                      name="publisherIpiNumber"
                      type="text"
                      defaultValue={track.publisherIpiNumber}
                      className="w-full text-xs"
                      placeholder="Ej: 12345678901"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="publisherPro"
                      className="text-[11px] text-muted-foreground"
                    >
                      PRO / Sociedad
                    </Label>
                    <Input
                      id="publisherPro"
                      name="publisherPro"
                      type="text"
                      defaultValue={track.publisherPro}
                      className="w-full text-xs"
                      placeholder="Ej: SCD, ASCAP, BMI"
                    />
                  </div>
                  <div className="space-y-1 border-l border-border pl-3">
                    <Label
                      htmlFor="publisherCaeNumber"
                      className="text-[11px] text-muted-foreground"
                    >
                      CAE
                    </Label>
                    <Input
                      id="publisherCaeNumber"
                      name="publisherCaeNumber"
                      type="text"
                      defaultValue={track.publisherCaeNumber}
                      className="w-full text-xs"
                      placeholder="Ej: 987654321"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {/* MFN */}
            <div className="rounded-md border border-border bg-card/70 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="hidden"
                  name="mfn"
                  value={mfnChecked ? "true" : "false"}
                />
                <Checkbox
                  id="mfn"
                  checked={mfnChecked}
                  onCheckedChange={(checked) => setMfnChecked(checked === true)}
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="mfn"
                    className="text-xs font-medium text-foreground"
                  >
                    MFN (Most Favoured Nations)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Marca esto si las condiciones de este master deben ser al
                    menos tan favorables como las de otros proveedores en el
                    mismo proyecto/campaña.
                  </p>
                </div>
              </div>
            </div>

            {/* One-stop / Cleared */}
            <div className="rounded-md border border-border bg-card/70 p-2">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-foreground">
                  One-stop / Cleared
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <input
                      type="hidden"
                      name="oneStop"
                      value={oneStopChecked ? "true" : "false"}
                    />
                    <Checkbox
                      id="oneStop"
                      checked={oneStopChecked}
                      onCheckedChange={(checked) =>
                        setOneStopChecked(checked === true)
                      }
                    />
                    <Label
                      htmlFor="oneStop"
                      className="text-[11px] text-muted-foreground"
                    >
                      One-stop (master + publishing)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <input
                      type="hidden"
                      name="clearedForSync"
                      value={clearedChecked ? "true" : "false"}
                    />
                    <Checkbox
                      id="clearedForSync"
                      checked={clearedChecked}
                      onCheckedChange={(checked) =>
                        setClearedChecked(checked === true)
                      }
                    />
                    <Label
                      htmlFor="clearedForSync"
                      className="text-[11px] text-muted-foreground"
                    >
                      Cleared para sync
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Content ID enrolled */}
            <div className="rounded-md border border-border bg-card/70 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="hidden"
                  name="contentIdEnrolled"
                  value={contentIdChecked ? "true" : "false"}
                />
                <Checkbox
                  id="contentIdEnrolled"
                  checked={contentIdChecked}
                  onCheckedChange={(checked) =>
                    setContentIdChecked(checked === true)
                  }
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="contentIdEnrolled"
                    className="text-xs font-medium text-foreground"
                  >
                    Enrolado en Content ID (YouTube)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Márcalo si este master está (o estará) registrado en un
                    sistema de Content ID (YouTube, Facebook, etc.).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-1 rounded-lg border border-border bg-card/80 p-3">
          <h3 className="text-sm font-semibold text-foreground">
            Content ID &amp; administracion
          </h3>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Define quien administra Content ID y que canales deben estar
            exentos de reclamaciones (whitelist).
          </p>

          <FormField
            htmlFor="contentIdAdmin"
            error={firstError(serverErrors, "contentIdAdmin")}
            label="Admin Content ID"
            descriptionPosition="above"
            className="mb-5"
            description={
              <>
                Quien administra Content ID. Ej:{" "}
                <span className="font-mono">Identifyy</span>,{" "}
                <span className="font-mono">HAWWK</span>,{" "}
                <span className="font-mono">Propietario directo</span>.
              </>
            }
          >
            <Input
              id="contentIdAdmin"
              name="contentIdAdmin"
              type="text"
              defaultValue={track.contentIdAdmin}
              className="mt-0.5 w-full text-xs"
              placeholder="Ej: Identifyy como administrador de Content ID"
            />
          </FormField>

          <FormField
            htmlFor="contentIdWhitelist"
            error={firstError(serverErrors, "contentIdWhitelist")}
            label="Whitelist Content ID"
            descriptionPosition="above"
            description={
              <>
                Canales o cuentas excluidas de reclamaciones. Una por linea o
                separadas por comas. Ej: nombres de canales de clientes, tu
                propio canal, etc.
              </>
            }
          >
            <Textarea
              id="contentIdWhitelist"
              name="contentIdWhitelist"
              defaultValue={track.contentIdWhitelist}
              rows={4}
              className="mt-0.5 w-full resize-y text-xs"
              placeholder={`Ej: lynxmediaofficial
cliente_marca_tv
cliente_youtube_channel`}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
