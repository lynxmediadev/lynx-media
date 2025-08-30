/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/admin/DebugDrawer.tsx                                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Muestra un panel colapsable con el resultado de la última corrida del     │
 * │   analizador: tiempo total HTTP, warnings y el JSON completo (copiable).    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - No consulta nada por su cuenta: sólo renderiza lo que le pases por props. │
 * │ - `elapsedMs` es la duración medida en el cliente (del fetch POST completo).│
 * │ - Si `data?.debug?.timings` existiera en el futuro, también los listará.    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import React from "react";
import CopyButton from "@/components/ui/CopyButton";

type Props = {
  data: any | null;       // JSON completo de la última corrida (respuesta del endpoint)
  elapsedMs: number | null; // Tiempo total HTTP medido en AnalyzeActions
  className?: string;
};

export default function DebugDrawer({ data, elapsedMs, className = "" }: Props) {
  // Construimos un string “bonito” del JSON para el visor y el botón Copiar
  const pretty = data ? JSON.stringify(data, null, 2) : "";

  // Extra: warnings del backend si existen
  const warnings: string[] | undefined = data?.warnings;

  // Extra: si en el futuro añadimos timings desde backend (debug.timings), se listarán aquí:
  const timings: Record<string, number> | undefined = data?.debug?.timings;

  return (
    <details className={`mt-3 rounded border border-gray-200 ${className}`}>
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
        Debug del último análisis
        {elapsedMs != null && (
          <span className="ml-2 text-gray-500 font-normal">
            · HTTP total: {Math.round(elapsedMs)} ms
          </span>
        )}
      </summary>

      <div className="p-3 space-y-3 text-sm">
        {/* Warnings, si llegaron del backend */}
        {warnings && warnings.length > 0 && (
          <div className="rounded bg-amber-50 border border-amber-200 p-2">
            <div className="text-amber-800 font-medium mb-1">Warnings</div>
            <ul className="list-disc pl-5 text-amber-900">
              {warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Timings del backend (opcional / futuro) */}
        {timings && (
          <div className="rounded bg-sky-50 border border-sky-200 p-2">
            <div className="text-sky-800 font-medium mb-1">Tiempos (backend)</div>
            <ul className="list-disc pl-5 text-sky-900">
              {Object.entries(timings).map(([k, v]) => (
                <li key={k}>
                  {k}: {Math.round(Number(v))} ms
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* JSON completo + botón Copiar */}
        <div className="flex items-center justify-between">
          <div className="font-medium">Payload de respuesta</div>
          {data ? <CopyButton text={pretty} label="Copiar JSON" size="sm" /> : null}
        </div>
        <pre className="whitespace-pre-wrap overflow-auto text-xs rounded bg-gray-50 border border-gray-200 p-3">
{pretty || "Corre un análisis para ver el payload aquí…"}
        </pre>
      </div>
    </details>
  );
}
