// src/app/admin/insights/export/route.ts
/**
 * /admin/insights/export — CSV de agregados (ordenado en JS por _count._all)
 * Peras y manzanas:
 * - Quitamos orderBy en Prisma groupBy y ordenamos en memoria.
 * - Mantenemos el mismo rango que /admin/insights.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseDateBoundary } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const today = new Date();
  const defaultTo = new Date(today);
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const gte = parseDateBoundary(from || defaultFrom.toISOString().slice(0, 10), false);
  const lte = parseDateBoundary(to || defaultTo.toISOString().slice(0, 10), true);

  const where = {
    ...(gte || lte
      ? {
          createdAt: {
            ...(gte ? { gte } : {}),
            ...(lte ? { lte } : {}),
          },
        }
      : {}),
  } as const;

  const [total, byStatusRaw, byPriorityRaw, topTracksRaw] = await Promise.all([
    prisma.licensingRequest.count({ where }),
    prisma.licensingRequest.groupBy({ by: ["status"], _count: { _all: true }, where }),
    prisma.licensingRequest.groupBy({ by: ["priority"], _count: { _all: true }, where }),
    prisma.licensingRequest.groupBy({ by: ["trackId", "trackTitle", "trackArtist"], _count: { _all: true }, where }),
  ]);

  const byStatus = byStatusRaw.sort((a, b) => b._count._all - a._count._all);
  const byPriority = byPriorityRaw.sort((a, b) => b._count._all - a._count._all);
  const topTracks = topTracksRaw.sort((a, b) => b._count._all - a._count._all).slice(0, 10);

  const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const lines: string[] = [];

  lines.push(`"Insights Licensing","${gte?.toISOString().slice(0, 10) || ""}","${lte?.toISOString().slice(0, 10) || ""}"`);
  lines.push("");

  lines.push("Total");
  lines.push(`"Solicitudes",${total}`);
  lines.push("");

  lines.push("Por Estado");
  lines.push("Estado,Cantidad");
  for (const s of byStatus) lines.push(`${esc(s.status)},${s._count._all}`);
  lines.push("");

  lines.push("Por Prioridad");
  lines.push("Prioridad,Cantidad");
  for (const p of byPriority) lines.push(`${esc(p.priority)},${p._count._all}`);
  lines.push("");

  lines.push("Top Tracks (10)");
  lines.push("Rank,Track,Artista,Solicitudes,TrackID");
  topTracks.forEach((t, i) => {
    lines.push(`${i + 1},${esc(t.trackTitle || t.trackId)},${esc(t.trackArtist || "")},${t._count._all},${esc(t.trackId)}`);
  });

  const csv = lines.join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="insights_${(gte?.toISOString().slice(0, 10)) || "from"}_${(lte?.toISOString().slice(0, 10)) || "to"}.csv"`,
    },
  });
}
