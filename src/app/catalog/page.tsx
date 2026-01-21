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

type SearchParams = { [key: string]: string | string[] | undefined };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp =
    searchParams && "then" in (searchParams as Promise<SearchParams>)
      ? await (searchParams as Promise<SearchParams>)
      : (searchParams as SearchParams | undefined);

  const moods = toArray(sp?.mood).map((m) => m.trim()).filter(Boolean);
  const uses = toArray(sp?.use).map((u) => u.trim()).filter(Boolean);
  const artist = pickFirst(sp?.artist)?.trim() ?? "";
  const q = pickFirst(sp?.q)?.trim() ?? "";

  const filters = [
    moods.length ? { moods: { hasSome: moods } } : null,
    uses.length ? { uses: { hasSome: uses } } : null,
    artist ? { artist: { contains: artist, mode: "insensitive" as const } } : null,
    q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { artist: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : null,
  ].filter(Boolean);

  // Intentamos traer tracks reales (con waveform)
  const dbTracks = await prisma.track.findMany({
    where: filters.length ? { AND: filters } : undefined,
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
    bpm: t.bpm ?? undefined,
    duration: formatDurationSec(t.durationSec),
    durationSec: t.durationSec ?? null,
    key: t.key ?? undefined,
    audioUrl: t.audioUrl,
    waveformB64: bytesToBase64(t.waveform as any),
  }));

  const filteredMocks = MOCK_TRACKS.filter((t) => {
    if (moods.length && !t.moods.some((m) => moods.includes(m))) return false;
    if (uses.length && !t.uses.some((u) => uses.includes(u))) return false;
    if (artist && !t.artist.toLowerCase().includes(artist.toLowerCase())) return false;
    if (q) {
      const haystack = `${t.title} ${t.artist}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    return true;
  }).map((t) => ({ ...t, durationSec: null, waveformB64: null }));

  const tracks: CatalogTrack[] = mappedFromDb.length > 0 ? mappedFromDb : filteredMocks;

  return <CatalogClient tracks={tracks} />;
}
