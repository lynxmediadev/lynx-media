import CatalogClient from "./CatalogClient";
import prisma from "@/lib/prisma";
import { MOCK_TRACKS } from "@/lib/catalog/mockTracks";
import type { Track } from "@/lib/catalog/types";

export const dynamic = "force-dynamic";

type CatalogTrack = Track & { waveformB64?: string | null; durationSec?: number | null };

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

export default async function CatalogPage() {
  // Intentamos traer tracks reales (con waveform)
  const dbTracks = await prisma.track.findMany({
    select: {
      id: true,
      title: true,
      artist: true,
      moods: true,
      uses: true,
      audioUrl: true,
      durationSec: true,
      waveform: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const mappedFromDb: CatalogTrack[] = dbTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    moods: t.moods ?? [],
    uses: t.uses ?? [],
    bpm: undefined,
    duration: formatDurationSec(t.durationSec),
    durationSec: t.durationSec ?? null,
    key: undefined,
    audioUrl: t.audioUrl,
    waveformB64: bytesToBase64(t.waveform as any),
  }));

  const tracks: CatalogTrack[] =
    mappedFromDb.length > 0
      ? mappedFromDb
      : MOCK_TRACKS.map((t) => ({ ...t, durationSec: null, waveformB64: null }));

  return <CatalogClient tracks={tracks} />;
}
