/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Demo del hook useTracksList                                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Renderiza lista paginable (Load more) usando el hook sobre /api/tracks.  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Visita /dev/tracks-helper-demo                                           │
 * │ - Pulsa “Cargar más” hasta que nextCursor sea null.                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";

import { useState } from "react";
import { useTracksList } from "@/hooks/useTracksList";

export default function TracksHelperDemoPage() {
  // Filtros de ejemplo (puedes conectarlos a inputs o a tu UI real)
  const [q] = useState<string>("");
  const [mood] = useState<string[] | undefined>(undefined);
  const [use] = useState<string[] | undefined>(undefined);

  const { items, totalCount, nextCursor, isLoading, error, loadMore } = useTracksList({
    q,
    mood,
    use,
    limit: 6,
    order: "createdAt",
    dir: "desc",
  });

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Demo · useTracksList</h1>
      <p className="text-sm opacity-80">
        totalCount: {totalCount} — página de {items.length} ítems {nextCursor ? "(hay más)" : "(fin)"}
      </p>
      {error ? <p className="text-sm text-red-500">Error: {error}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t) => (
          <article key={t.id} className="rounded-lg border p-4 space-y-2">
            <div className="text-xs opacity-60">{t.id}</div>
            <h3 className="font-semibold">{t.title}</h3>
            <p className="opacity-80">{t.artist}</p>
            {t.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.coverUrl} alt={t.title} className="mt-2 w-full h-40 object-cover rounded-md" />
            ) : null}
            <div className="text-xs opacity-70">
              <strong>Moods:</strong> {t.moods.join(" · ") || "—"}
            </div>
            <div className="text-xs opacity-70">
              <strong>Uses:</strong> {t.uses.join(" · ") || "—"}
            </div>
          </article>
        ))}
      </section>

      <div className="mt-4">
        <button
          className="rounded-md border px-4 py-2"
          onClick={loadMore}
          disabled={isLoading || !nextCursor}
          title={nextCursor ?? undefined}
        >
          {isLoading ? "Cargando…" : nextCursor ? "Cargar más" : "No hay más"}
        </button>
      </div>
    </main>
  );
}
