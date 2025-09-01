/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/tracks/page.tsx                                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Lista pública muy básica de tracks con link a /track/[id].               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Es un primer “esqueleto”; luego lo reemplazamos por D1 completo           │
 * │   (buscador, filtros por mood/uso/bpm…).                                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import { db } from "@/server/db";

export default async function PublicCatalogPage() {
  const rows = await db.track.findMany({
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: { id: true, title: true, artist: true },
  });

  return (
    <div className="min-h-dvh bg-[#0b0b0b] text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Catálogo</h1>
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {rows.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-white/10 p-4 hover:border-white/20"
            >
              <div className="text-sm text-zinc-400">{t.artist ?? "—"}</div>
              <Link
                href={`/track/${t.id}`}
                className="text-lg font-medium hover:underline"
              >
                {t.title ?? "Sin título"}
              </Link>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="text-sm text-zinc-400">
              Aún no hay elementos en el catálogo.
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}
