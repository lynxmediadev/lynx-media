// src/app/admin/track/[id]/tech/ui/TrackHeaderActions.client.tsx
/**
 * TrackHeaderActions (cliente)
 *
 * Peras y manzanas:
 * - Renderiza los 3 botones de la cabecera en /admin/track/[id]/edit:
 *     • Analizar  → llama a /api/tracks/[id]/analyze y hace refresh
 *     • Payload   → abre un modal centrado con el JSON del análisis
 *                   (usa el mismo PayloadPanel que antes estaba en la sección de audio)
 *     • Volver al listado → /admin/analyze
 *
 * - Es un componente de UI local a las rutas de track:
 *     /admin/track/[id]/edit
 *   No toca la lógica del endpoint ni la DB, sólo hace fetch + router.refresh().
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PayloadPanel from "./PayloadPanel.client";

type TrackHeaderActionsProps = {
  trackId: string;
};

export default function TrackHeaderActions({ trackId }: TrackHeaderActionsProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analyzeError, setAnalyzeError] = React.useState<string | null>(null);
  const [isPayloadOpen, setIsPayloadOpen] = React.useState(false);

  async function handleAnalyze() {
    try {
      setIsAnalyzing(true);
      setAnalyzeError(null);

      const res = await fetch(`/api/tracks/${trackId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Respuesta ${res.status}`);
      }

      // Forzamos re-render del server component con datos actualizados
      router.refresh();
    } catch (err) {
      console.error("[TrackHeaderActions] Error al analizar:", err);
      setAnalyzeError("Error al analizar. Revisa consola/logs.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function openPayload() {
    setIsPayloadOpen(true);
  }

  function closePayload() {
    setIsPayloadOpen(false);
  }

  return (
    <>
      {/* Grupo de botones de cabecera */}
      <div className="flex items-center gap-2">
        {/* Analizar */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? "Analizando…" : "Analizar"}
        </button>

        {/* Payload (modal) */}
        <button
          type="button"
          onClick={openPayload}
          className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
        >
          Payload
        </button>

        {/* Volver al listado */}
        <Link
          href="/admin/analyze"
          className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs font-medium text-zinc-100 hover:bg-zinc-900"
        >
          Volver al listado
        </Link>
      </div>

      {/* Mensaje de error de análisis (si aplica) */}
      {analyzeError && (
        <p className="mt-1 text-right text-[11px] text-red-400">
          {analyzeError}
        </p>
      )}

      {/* Modal de Payload */}
      {isPayloadOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
          onClick={closePayload}
        >
          <div
            className="relative max-h-[80vh] w-[90vw] max-w-3xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-50">
                  Payload de análisis
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Último JSON devuelto por <code>/api/tracks/{trackId}/analyze</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={closePayload}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
              >
                Cerrar
              </button>
            </div>

            {/* Contenido scrollable con PayloadPanel reutilizado */}
            <div className="max-h-[70vh] overflow-auto px-4 py-3">
              <PayloadPanel endpoint={`/api/tracks/${trackId}/analyze`} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
