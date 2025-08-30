/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/admin/AnalyzeByIdForm.tsx                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Formulario simple para pegar un Track ID y ejecutar análisis rápido       │
 * │   (Analizar / Analizar+Normalizar) sin salir del Overview.                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Client Component (usa useState).                                          │
 * │ - Cuando hay ID válido, muestra AnalyzeActions y un link a la Ficha.        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import React from "react";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import Link from "next/link";

export default function AnalyzeByIdForm() {
  const [id, setId] = React.useState("");

  // Validación mínima: 26+ chars como los cuid que muestras
  const ok = id.trim().length >= 10;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="cmex... (Track ID)"
          className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <div className="text-xs text-gray-500">Pega aquí el ID del track.</div>
      </div>

      {ok ? (
        <div className="flex items-center gap-3">
          <AnalyzeActions id={id.trim()} />
          <Link
            href={`/admin/track/${id.trim()}/tech`}
            className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            title="Abrir ficha técnica"
          >
            Ver Ficha
          </Link>
        </div>
      ) : (
        <div className="text-xs text-gray-500">Ingresa un ID válido para habilitar acciones.</div>
      )}
    </div>
  );
}
