// src/components/admin/track/RightsFormClient.tsx
/**
 * Formulario reutilizable de "Derechos & explotación" (admin).
 *
 * Peras y manzanas:
 * - Se usa tanto en:
 *     • /admin/track/[id]/rights
 *     • /admin/track/[id]/edit
 * - Dibuja la sección completa:
 *     • Header con título + descripción + botón "Guardar derechos"
 *     • Bloque 1 (fila superior):
 *         - Columna izquierda: "Licencia & alcance"
 *         - Columna derecha: "Master & publishing"
 *     • Bloque 2 (fila inferior):
 *         - Columna izquierda: "Content ID & administración"
 *         - Columna derecha: "Restricciones de uso"
 *
 * Notas:
 * - No se toca la lógica de la server action `updateRights`.
 * - Los nombres de los campos (`name="..."`) se mantienen para no romper nada.
 * - Tras guardar, se hace `router.refresh()` para recargar datos desde la BD.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateRights } from "@/app/admin/track/[id]/rights/actions";

type RightsTrackFormProps = {
  track: {
    id: string;
    licenseType: string;
    territories: string;
    term: string;
    mediaBuy: string;
    mfn: boolean;
    contentIdEnrolled: boolean;
    contentIdAdmin: string;
    contentIdWhitelist: string;
    master: string;
    restrictionsStr: string;
    writerName: string;
    writerSharePct: number | null;
    publisherName: string;
    publisherSharePct: number | null;
  };
};

type StatusState = {
  ok?: boolean;
  message?: string;
} | null;

/**
 * Botón de envío que refleja el estado de guardado.
 */
function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar derechos"}
    </button>
  );
}

export default function RightsFormClient({ track }: RightsTrackFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<StatusState>(null);

  /**
   * Handler de envío:
   * - Se ejecuta en el cliente.
   * - Llama a la server action `updateRights(formData)`.
   * - Luego fuerza `router.refresh()` para que la página se renderice
   *   otra vez con los datos actualizados desde la BD.
   */
  async function handleAction(formData: FormData) {
    setPending(true);
    setStatus(null);

    try {
      const result = (await updateRights(formData)) as StatusState;
      setStatus(result ?? { ok: true, message: "Guardado" });

      // Refresca la ruta actual (/edit o /rights) y el listado
      router.refresh();
    } catch (err) {
      console.error("[RightsFormClient] error al guardar derechos:", err);
      setStatus({
        ok: false,
        message: "Error al guardar derechos. Revisa consola/servidor.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleAction} className="space-y-4">
      {/* ID oculto para la server action */}
      <input type="hidden" name="id" defaultValue={track.id} />

      {/* HEADER + BOTÓN GUARDAR */}
      <div className="flex flex-col gap-2 border-b border-zinc-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-50">
            Derechos &amp; explotación
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Condiciones marco para sync/licensing: licencia, territorios, MFN,
            Content ID, publishing, etc.
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

      {/* BLOQUE SUPERIOR: Licencia & alcance / Master & publishing */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sub-sección izquierda: Licencia & alcance */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          
          
          <h3 className="text-sm font-semibold text-zinc-50">
            Licencia &amp; alcance
          </h3>
          <p className="text-[11px] text-zinc-500">
            Define el marco general de explotación del master para este track:
            tipo de licencia, territorios, plazo y si está pensado para paid
            media.
          </p>

          {/* Fila 1: licencia + plazo (columna izquierda) / territorios + media buy (columna derecha) */}
          <div className="grid gap-3 md:grid-cols-1">
            <div className="space-y-2">
              {/* licenseType */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-200">
                  Tipo de licencia
                </label>
                <p className="text-[11px] text-zinc-500">
                  Ej:{" "}
                  <span className="font-mono">Exclusive sync</span>,{" "}
                  <span className="font-mono">Non-exclusive sync</span>,{" "}
                  <span className="font-mono">Custom buyout</span>.
                </p>
                <input
                  type="text"
                  name="licenseType"
                  defaultValue={track.licenseType}
                  className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                  placeholder="Ej: Exclusive sync para este catálogo"
                />
              </div>

              {/* term */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-200">
                  Plazo (term)
                </label>
                <p className="text-[11px] text-zinc-500">
                  Ej: <span className="font-mono">Perpetual</span>,{" "}
                  <span className="font-mono">5 years from first use</span>,{" "}
                  <span className="font-mono">1 year</span>.
                </p>
                <input
                  type="text"
                  name="term"
                  defaultValue={track.term}
                  className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                  placeholder="Ej: Perpetual para usos aprobados"
                />
              </div>
            </div>

            <div className="space-y-2">
              {/* territories */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-200">
                  Territorios
                </label>
                <p className="text-[11px] text-zinc-500">
                  Ej: <span className="font-mono">World</span>,{" "}
                  <span className="font-mono">LATAM</span>,{" "}
                  <span className="font-mono">Chile only</span>.
                </p>
                <input
                  type="text"
                  name="territories"
                  defaultValue={track.territories}
                  className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                  placeholder="Ej: World (salvo exclusiones específicas)"
                />
              </div>

              {/* mediaBuy */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-200">
                  Media buy / Paid media
                </label>
                <p className="text-[11px] text-zinc-500">
                  Ej: <span className="font-mono">No paid media</span>,{" "}
                  <span className="font-mono">Digital only (Meta/YouTube)</span>,{" "}
                  <span className="font-mono">TV + Digital</span>.
                </p>
                <input
                  type="text"
                  name="mediaBuy"
                  defaultValue={track.mediaBuy}
                  className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                  placeholder="Ej: Digital only, sin TV abierta"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: MFN + Content ID enrolled, uno bajo el otro */}
          
        </div>

        {/* Sub-sección derecha: Master & publishing */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <h3 className="text-sm font-semibold text-zinc-50">
            Master &amp; publishing
          </h3>
          <p className="text-[11px] text-zinc-500">
            Define quién controla el master y cómo se reparte el publishing
            entre writer y publisher.
          </p>

          {/* Master */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-200">
              Master (titular)
            </label>
            <p className="text-[11px] text-zinc-500">
              Ej: <span className="font-mono">Lynx Media 100%</span>,{" "}
              <span className="font-mono">Lynx 50% / Cliente 50%</span>.
            </p>
            <input
              type="text"
              name="master"
              defaultValue={track.master}
              className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
              placeholder="Ej: Lynx Media 100% master ownership"
            />
          </div>

          {/* Publishing split */}
          <div className="space-y-2 pt-1">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h4 className="text-xs font-semibold text-zinc-100">
                  Publishing split
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Define nombre y porcentaje (entero) para Writer y Publisher.
                  Suma recomendada ≈ 100%.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Columna Writer */}
              <div className="space-y-1 rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
                <p className="text-[11px] font-semibold text-emerald-400">
                  Writer
                </p>
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-300">
                    Nombre / entidad
                  </label>
                  <input
                    type="text"
                    name="writerName"
                    defaultValue={track.writerName}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                    placeholder="Ej: Diego Fernández (writer)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-300">
                    % (entero)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      name="writerSharePct"
                      defaultValue={
                        track.writerSharePct !== null
                          ? track.writerSharePct
                          : ""
                      }
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                      placeholder="Ej: 50"
                    />
                    <span className="text-[11px] text-zinc-400">%</span>
                  </div>
                </div>
              </div>

              {/* Columna Publisher */}
              <div className="space-y-1 rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
                <p className="text-[11px] font-semibold text-sky-400">
                  Publisher
                </p>
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-300">
                    Nombre / entidad
                  </label>
                  <input
                    type="text"
                    name="publisherName"
                    defaultValue={track.publisherName}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                    placeholder="Ej: Lynx Publishing"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-300">
                    % (entero)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      name="publisherSharePct"
                      defaultValue={
                        track.publisherSharePct !== null
                          ? track.publisherSharePct
                          : ""
                      }
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
                      placeholder="Ej: 50"
                    />
                    <span className="text-[11px] text-zinc-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {/* MFN */}
            <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
              <div className="flex items-center gap-2">
                <input
                  id="mfn"
                  type="checkbox"
                  name="mfn"
                  defaultChecked={track.mfn}
                  className="h-3.5 w-3.5 flex-shrink-0 rounded border-zinc-600 bg-zinc-900 text-zinc-100"
                />
                <div className="space-y-0.5">
                  <label
                    htmlFor="mfn"
                    className="text-xs font-medium text-zinc-200"
                  >
                    MFN (Most Favoured Nations)
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Marca esto si las condiciones de este master deben ser al
                    menos tan favorables como las de otros proveedores en el
                    mismo proyecto/campaña.
                  </p>
                </div>
              </div>
            </div>

            {/* Content ID enrolled */}
            <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
              <div className="flex items-center gap-2">
                <input
                  id="contentIdEnrolled"
                  type="checkbox"
                  name="contentIdEnrolled"
                  defaultChecked={track.contentIdEnrolled}
                  className="h-3.5 w-3.5 flex-shrink-0 rounded border-zinc-600 bg-zinc-900 text-zinc-100"
                />
                <div className="space-y-0.5">
                  <label
                    htmlFor="contentIdEnrolled"
                    className="text-xs font-medium text-zinc-200"
                  >
                    Enrolado en Content ID (YouTube)
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Márcalo si este master está (o estará) registrado en un
                    sistema de Content ID (YouTube, Facebook, etc.).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE INFERIOR: Content ID & administración / Restricciones */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sub-sección izquierda: Content ID & administración */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <h3 className="text-sm font-semibold text-zinc-50">
            Content ID &amp; administración
          </h3>
          <p className="text-[11px] text-zinc-500">
            Define quién administra Content ID y qué canales deben estar
            exentos de reclamaciones (whitelist).
          </p>

          {/* contentIdAdmin */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-200">
              Admin Content ID
            </label>
            <p className="text-[11px] text-zinc-500">
              Quién administra Content ID. Ej:{" "}
              <span className="font-mono">Identifyy</span>,{" "}
              <span className="font-mono">HAWWK</span>,{" "}
              <span className="font-mono">Propietario directo</span>.
            </p>
            <input
              type="text"
              name="contentIdAdmin"
              defaultValue={track.contentIdAdmin}
              className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
              placeholder="Ej: Identifyy como administrador de Content ID"
            />
          </div>

          {/* contentIdWhitelist */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-200">
              Whitelist Content ID
            </label>
            <p className="text-[11px] text-zinc-500">
              Canales o cuentas excluidas de reclamaciones. Una por línea o
              separadas por comas. Ej: nombres de canales de clientes, tu
              propio canal, etc.
            </p>
            <textarea
              name="contentIdWhitelist"
              defaultValue={track.contentIdWhitelist}
              rows={4}
              className="mt-0.5 w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
              placeholder={`Ej:
lynxmediaofficial
cliente_marca_tv
cliente_youtube_channel`}
            />
          </div>
        </div>

        {/* Sub-sección derecha: Restricciones de uso */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <h3 className="text-sm font-semibold text-zinc-50">
            Restricciones de uso
          </h3>
          <p className="text-[11px] text-zinc-500">
            Indica usos que NO están permitidos para este master. Una
            restricción por línea.
          </p>
          <textarea
            name="restrictions"
            defaultValue={track.restrictionsStr}
            rows={8}
            className="mt-0.5 w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500"
            placeholder={`Ej:
No usos políticos partidistas.
No campañas relacionadas a tabaco/armas.
No contenidos de odio o discriminación.`}
          />
        </div>
      </div>
    </form>
  );
}
