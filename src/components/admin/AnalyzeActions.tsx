/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/admin/AnalyzeActions.tsx                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Renderiza dos botones: "Analizar" y "Analizar + Normalizar asset".        │
 * │ - Ejecuta el endpoint POST /api/tracks/[id]/analyze (con o sin normalize=1).│
 * │ - Mide el tiempo total (HTTP) de la operación y lo pasa al DebugDrawer.     │
 * │ - Muestra en un panel colapsable el JSON devuelto y los warnings.           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - `elapsedMs` es el cronómetro del lado cliente (inicio y fin del fetch).   │
 * │ - No toca tu backend: es 100% UI y seguro (sin regresiones).                │
 * │ - Idempotente: puedes correr varias veces, se actualiza el "último debug".  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import React from "react";
import DebugDrawer from "@/components/admin/DebugDrawer";

type Props = {
  id: string;
  className?: string;
};

export default function AnalyzeActions({ id, className = "" }: Props) {
  const [isLoading, setIsLoading] = React.useState<"analyze" | "normalize" | null>(null);
  const [lastPayload, setLastPayload] = React.useState<any>(null);
  const [elapsedMs, setElapsedMs] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Helper básico para correr la acción
  async function run(normalize = false) {
    try {
      setError(null);
      setIsLoading(normalize ? "normalize" : "analyze");

      // Medimos tiempo total de la llamada HTTP (cliente)
      const t0 = performance.now();
      const res = await fetch(`/api/tracks/${id}/analyze${normalize ? "?normalize=1" : ""}`, {
        method: "POST",
      });
      const t1 = performance.now();
      setElapsedMs(t1 - t0);

      const json = await safeJson(res);
      setLastPayload(json);

      if (!res.ok) {
        setError(json?.error || `HTTP ${res.status}`);
      }
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className={className}>
      {/* Botones */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={isLoading !== null}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          title="Corre el analizador técnico (ffprobe/ebur128/loudnorm/waveform) sin tocar asset."
        >
          {isLoading === "analyze" ? "Analizando…" : "Analizar"}
        </button>

        <button
          type="button"
          onClick={() => run(true)}
          disabled={isLoading !== null}
          className="px-3 py-1.5 text-sm rounded border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50"
          title="Analiza y además normaliza el asset (assetKey/MIME/size) por HEAD/Range."
        >
          {isLoading === "normalize" ? "Analizando + Normalizando…" : "Analizar + Normalizar"}
        </button>
      </div>

      {/* Error de red/HTTP, si ocurre */}
      {error && (
        <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Panel de debug colapsable */}
      <DebugDrawer data={lastPayload} elapsedMs={elapsedMs} className="mt-2" />
    </div>
  );
}

/** Intenta parsear JSON de forma segura; si falla, devuelve shape mínima. */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Respuesta sin JSON", status: res.status };
  }
}
