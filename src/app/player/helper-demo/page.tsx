/**
 * ============================================================================
 * Archivo: src/app/player/helper-demo/page.tsx
 * Tipo: Server Component (sin "use client")
 * Objetivo (peras y manzanas):
 * - Hacer fetch de una lista corta de tracks desde la API usando URL absoluta.
 * - Pasar SOLO datos serializables (array de tracks) a un Client Component.
 * - NO definir handlers (onClick) aquí; eso se hace en el componente cliente.
 * ============================================================================
 */

import { getBaseUrl } from "@/lib/base-url";
import HelperDemoClient from "./track-list-client"; // ← Client Component
import React from "react";

export const dynamic = "force-dynamic";

type TrackLite = {
  id: string;
  title: string;
  artist: string | null;
  audioUrl: string | null;
  durationSec: number | null;
};

async function fetchRecentTracks(limit = 5): Promise<TrackLite[]> {
  const base = getBaseUrl();
  const url = new URL("/api/tracks", base);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order", "createdAt");
  url.searchParams.set("dir", "desc");
  url.searchParams.set("view", "list");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API /api/tracks respondió ${res.status}`);
  }
  const data = (await res.json()) as { items?: TrackLite[] } | TrackLite[];
  return Array.isArray(data) ? data : data.items ?? [];
}

export default async function HelperDemoPage() {
  let tracks: TrackLite[] = [];
  let apiError: string | null = null;

  try {
    tracks = await fetchRecentTracks(5);
  } catch (e: any) {
    apiError = e?.message ?? "Error desconocido al consultar /api/tracks";
    // Datos mock para no dejar la UI muerta
    tracks = [
      { id: "mock-1", title: "Demo Track A", artist: "Lynx", audioUrl: null, durationSec: 95 },
      { id: "mock-2", title: "Demo Track B", artist: "Lynx", audioUrl: null, durationSec: 123 },
    ];
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Player — Helper Demo</h1>
        <div className="text-sm text-zinc-400">Sandbox para probar helpers del player</div>
      </header>

      {apiError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200"
        >
          <p className="font-medium">Advertencia: API no disponible</p>
          <p className="text-sm opacity-90">{apiError}. Se muestran datos de ejemplo.</p>
        </div>
      )}

      {/* ✅ Pasamos SOLO datos serializables al Client Component */}
      <HelperDemoClient tracks={tracks} />
    </main>
  );
}
