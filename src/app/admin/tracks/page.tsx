/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/app/admin/tracks/page.tsx                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Lista de tracks con chips de estado (Analizado / Faltan datos / Falta     │
 * │   normalización) y acciones rápidas: Analizar, Analizar+Normalizar, Ficha.  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Server Component (sin hooks).                                             │
 * │ - Ordena por `updatedAt` desc y limita a 100.                               │
 * │ - FIX: el import correcto del `db` es `@/server/db`.                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import React from "react";
import Link from "next/link";
import { db } from "@/server/db"; // ✅ FIX de alias
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import { formatBytes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TracksListPage() {
  const tracks = await db.track.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      artist: true,
      analysisAt: true,
      updatedAt: true,
      assetKey: true,
      assetMime: true,
      assetSize: true,
      audioUrl: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      truePeakDbfs: true,
      waveform: true, // Bytes (Buffer)
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Tracks</h1>
        <Link href="/admin/analyze" className="text-sm text-indigo-600 hover:underline">
          ← Volver a Analizar / Normalizar
        </Link>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Track</Th>
              <Th className="hidden md:table-cell">LUFS</Th>
              <Th className="hidden md:table-cell">LRA</Th>
              <Th className="hidden md:table-cell">TP</Th>
              <Th>Estado</Th>
              <Th className="hidden lg:table-cell">Asset</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tracks.map((t) => {
              const st = deriveStatus(t);
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="font-medium">{t.title ?? "Sin título"}</div>
                    <div className="text-gray-500">{t.artist ?? "Sin artista"}</div>
                    <div className="text-[11px] text-gray-400">ID: {t.id}</div>
                  </Td>
                  <Td className="hidden md:table-cell">{fmtMaybe(t.loudnessLufs)}</Td>
                  <Td className="hidden md:table-cell">{fmtMaybe(t.loudnessRangeLu)}</Td>
                  <Td className="hidden md:table-cell">{fmtMaybe(t.truePeakDbfs)}</Td>
                  <Td>
                    <StatusChips status={st} />
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {t.assetKey ? (
                      <div className="text-xs">
                        <div className="font-mono break-all">{t.assetKey}</div>
                        <div className="text-gray-500">
                          {t.assetMime ?? "—"} · {t.assetSize != null ? formatBytes(t.assetSize) : "—"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin asset normalizado</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <AnalyzeActions id={t.id} />
                      <Link
                        href={`/admin/track/${t.id}/tech`}
                        className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Ficha
                      </Link>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================
 * Helpers de UI
 * ============================ */

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left font-medium text-gray-600 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}

type Row = {
  assetKey: string | null;
  assetMime: string | null;
  assetSize: number | null;
  waveform: Buffer | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
  analysisAt: Date | null;
};

type Status =
  | { kind: "ok" }
  | { kind: "missingData"; reasons: string[] }
  | { kind: "needsNormalization" };

function deriveStatus(t: Row): Status {
  const normalizedOk = !!t.assetKey && !!t.assetMime && !!t.assetSize && t.assetSize > 0;
  if (!normalizedOk) return { kind: "needsNormalization" };

  const hasWaveform = !!t.waveform && (t.waveform as unknown as Buffer).length > 0;
  const hasAudioMetrics = t.loudnessLufs != null && t.loudnessRangeLu != null && t.truePeakDbfs != null;
  const reasons: string[] = [];
  if (!hasWaveform) reasons.push("waveform");
  if (!hasAudioMetrics) reasons.push("métricas audio");

  if (reasons.length > 0) return { kind: "missingData", reasons };
  return { kind: "ok" };
}

function StatusChips({ status }: { status: Status }) {
  if (status.kind === "ok") {
    return <Chip color="emerald">Analizado</Chip>;
  }
  if (status.kind === "needsNormalization") {
    return <Chip color="rose">Falta normalización</Chip>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      <Chip color="amber">Faltan datos</Chip>
      {status.reasons.map((r) => (
        <Chip key={r} color="gray">
          {r}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: "emerald" | "amber" | "rose" | "gray" }) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-900",
    amber: "bg-amber-100 text-amber-900",
    rose: "bg-rose-100 text-rose-900",
    gray: "bg-gray-100 text-gray-700",
  } as const;
  return <span className={`inline-flex px-2 py-0.5 text-xs rounded ${map[color]}`}>{children}</span>;
}

function fmtMaybe(v: number | null) {
  return v == null || !isFinite(v) ? "—" : Number(v).toFixed(2);
}
