/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Demo de uso del helper getTracksList                                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Pide 5 tracks ordenados por createdAt desc y renderiza títulos/artistas. │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Visita /player/helper-demo para ver la lista inicial.                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { getTracksList } from "@/lib/api/tracks";

export default async function HelperDemoPage() {
  const page1 = await getTracksList({ limit: 5, order: "createdAt", dir: "desc" });

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">Helper Demo — 1ª página (5)</h1>
      <p className="text-sm opacity-80">totalCount: {page1.totalCount}</p>
      <ul className="mt-4 space-y-2">
        {page1.items.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong> — {t.artist}
          </li>
        ))}
      </ul>
      {page1.nextCursor ? (
        <p className="mt-4 text-sm">nextCursor: <code>{page1.nextCursor}</code></p>
      ) : (
        <p className="mt-4 text-sm">Sin más páginas con estos filtros.</p>
      )}
    </main>
  );
}
