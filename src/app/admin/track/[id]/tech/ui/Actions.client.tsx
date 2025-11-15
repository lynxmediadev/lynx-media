// src/app/admin/track/[id]/tech/ui/Actions.client.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: Actions (ficha técnica)                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Proporciona acciones para la vista /admin/track/[id]/tech:               │
 * │     • Analizar → POST /api/tracks/[id]/analyze + router.refresh()          │
 * │     • Volver al listado → navega a /admin/analyze                          │
 * │ - Reutiliza el mismo patrón de actualización que en /admin/analyze:        │
 * │   tras el análisis se refresca la página tech para mostrar LUFS/LRA/TP     │
 * │   actualizados sin recargar manualmente.                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Si pulsas Analizar aquí, la ficha técnica vuelve a consultar Prisma      │
 * │   y verás inmediatamente la duración, sample rate, LUFS, LRA, TP, etc.,    │
 * │   actualizados.                                                            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  trackId: string;
};

export function Actions({ trackId }: Props) {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const busy = isLoading || isPending;

  async function handleAnalyze() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/tracks/${encodeURIComponent(trackId)}/analyze`,
        {
          method: "POST",
        }
      );

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = { ok: false, error: "Respuesta sin JSON", status: res.status };
      }

      if (!res.ok || data?.ok === false) {
        setError(data?.error || `HTTP ${res.status}`);
      } else {
        // 🔁 Revalidar la ficha técnica con los valores nuevos
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (e: any) {
      setError(e?.message || "Error de red al analizar.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Analizando…" : "Analizar"}
        </button>

        <Link
          href="/admin/analyze"
          className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-900"
        >
          Volver al listado
        </Link>
      </div>

      {error && (
        <p className="text-[11px] text-amber-400">
          {error}
        </p>
      )}
    </div>
  );
}
