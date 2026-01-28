import prisma from "@/lib/prisma";
import type { Track } from "@/lib/catalog/types";

type CatalogTrack = Track & { waveformB64?: string | null; durationSec?: number | null };

export type CatalogFilters = {
  catalogSlug?: string | null;
  moods?: string[];
  uses?: string[];
  artist?: string;
  q?: string;
  limit?: number;
  includeWaveform?: boolean;
};

function formatDurationSec(durationSec?: number | null): string {
  if (!durationSec || durationSec <= 0 || Number.isNaN(durationSec)) return "—";
  const m = Math.floor(durationSec / 60);
  const s = Math.floor(durationSec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function bytesToBase64(buf: Buffer | Uint8Array | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

export async function fetchCatalogTracks({
  catalogSlug,
  moods = [],
  uses = [],
  artist,
  q,
  limit = 50,
  includeWaveform = true,
}: CatalogFilters): Promise<CatalogTrack[]> {
  const whereAND: any[] = [];

  if (catalogSlug) {
    whereAND.push({
      tags: {
        some: {
          tag: { slug: catalogSlug, type: "CATALOG" },
        },
      },
    });
  }

  if (moods.length) {
    whereAND.push({ moods: { hasSome: moods } });
  }
  if (uses.length) {
    whereAND.push({ uses: { hasSome: uses } });
  }
  if (artist) {
    whereAND.push({
      artist: { contains: artist, mode: "insensitive" as const },
    });
  }
  if (q) {
    whereAND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { artist: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  const dbTracks = await prisma.track.findMany({
    where: whereAND.length ? { AND: whereAND } : undefined,
    select: {
      id: true,
      title: true,
      artist: true,
      moods: true,
      uses: true,
      bpm: true,
      key: true,
      audioUrl: true,
      durationSec: true,
      waveform: includeWaveform,
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return dbTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    moods: t.moods ?? [],
    uses: t.uses ?? [],
    bpm: t.bpm ?? undefined,
    duration: formatDurationSec(t.durationSec),
    durationSec: t.durationSec ?? null,
    key: t.key ?? undefined,
    audioUrl: t.audioUrl,
    waveformB64: includeWaveform ? bytesToBase64(t.waveform as any) : undefined,
  }));
}
