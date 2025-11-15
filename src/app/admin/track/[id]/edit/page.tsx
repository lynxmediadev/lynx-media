// src/app/admin/track/[id]/edit/page.tsx
/**
 * Editor unificado de track (admin)
 *
 * Ruta:
 *   - /admin/track/[id]/edit
 *
 * Unifica:
 *   • Audio & análisis técnico (player + métricas)
 *   • Metadata creativa (título, artista, moods, usos)
 *   • Identificadores (ISRC, ISWC, UPC)
 *   • Derechos & explotación
 *
 * Notas:
 *   - Audio & análisis técnico va al comienzo de la página.
 *   - Botones "Guardar" de Creativo e Identificadores se manejan dentro de
 *     sus respectivos formularios (opción 1: alineados con el título).
 */

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { db } from "@/server/db";
import PublicAudioBar from "@/components/public/PublicAudioBar";
import CreativeForm from "@/components/admin/CreativeForm";
import IdsForm from "@/components/admin/IdsForm";
import RightsFormClient from "../rights/rights-form.client";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { getS3PublicUrl } from "@/lib/storage/s3";

export const dynamic = "force-dynamic";

type Params =
  | { id: string }
  | Promise<{ id: string }>;

/** Convierte Buffer/Uint8Array → base64 para el waveform del player técnico */
function bytesToBase64(buf: Buffer | Uint8Array | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

/** Normaliza lista desde textarea o input (comas / saltos de línea) → array único */
function toCleanList(input: string | null | undefined): string[] {
  if (!input) return [];
  return Array.from(
    new Set(
      input
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

/** Normaliza ISRC a MAYÚSCULAS sin espacios ni guiones */
function normalizeISRC(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[-\s]/g, "").toUpperCase();
  return cleaned.length ? cleaned : null;
}

/** Normalización simple: trim, vacío → null */
function normalizeSimple(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

export default async function AdminTrackEditPage({ params }: { params: Params }) {
  // Soporta params síncrono y Promise (patrón Next 15)
  const p = "then" in (params as any)
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string });

  const { id } = p;

  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,

      // Creativo
      title: true,
      artist: true,
      moods: true,
      uses: true,

      // Audio / asset
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      durationSec: true,
      sampleRateHz: true,
      channels: true,
      bitrateKbps: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      lraLowLufs: true,
      lraHighLufs: true,
      truePeakDbfs: true,
      waveform: true,
      analysisAt: true,

      // Identificadores
      isrc: true,
      iswc: true,
      upc: true,

      // Derechos
      master: true,
      publishingSplit: true,
      licenseType: true,
      territories: true,
      term: true,
      mediaBuy: true,
      mfn: true,
      restrictions: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
    },
  });

  if (!track) {
    notFound();
  }

  const publicSrc = track.assetKey
    ? getS3PublicUrl(track.assetKey)
    : track.audioUrl ?? null;

  const waveformB64 = track.waveform
    ? bytesToBase64(track.waveform as any)
    : null;

  // ----------------- Server Actions (secciones) -----------------

  async function updateCreative(formData: FormData) {
    "use server";
    try {
      const title = (formData.get("title") as string | null)?.trim() || null;
      const artist = (formData.get("artist") as string | null)?.trim() || null;
      const moods = toCleanList(formData.get("moods") as string | null);
      const uses = toCleanList(formData.get("uses") as string | null);

      await db.track.update({
        where: { id: track.id },
        data: { title, artist, moods, uses },
        select: { id: true },
      });

      revalidatePath(`/admin/track/${track.id}/edit`);
      revalidatePath(`/admin/track/${track.id}/creative`);

      return { ok: true, message: "Guardado" };
    } catch (err) {
      console.error("[track:edit:updateCreative] fatal:", err);
      return { ok: false, message: "Error al guardar" };
    }
  }

  async function updateIds(formData: FormData) {
    "use server";
    try {
      const isrc = normalizeISRC(formData.get("isrc") as string | null);
      const iswc = normalizeSimple(formData.get("iswc") as string | null);
      const upc = normalizeSimple(formData.get("upc") as string | null);

      await db.track.update({
        where: { id: track.id },
        data: { isrc, iswc, upc },
        select: { id: true },
      });

      revalidatePath(`/admin/track/${track.id}/edit`);
      revalidatePath(`/admin/track/${track.id}/ids`);

      return { ok: true, message: "Guardado" };
    } catch (err) {
      console.error("[track:edit:updateIds] fatal:", err);
      return { ok: false, message: "Error al guardar" };
    }
  }

  const restrictionsStr = (track.restrictions ?? []).join("\n");
  const publishingSplitStr = track.publishingSplit ?? "";

  return (
    <main className="mx-auto w-[80vw] max-w-7xl p-4 space-y-6">
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col gap-3 border-b border-zinc-800 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">
            Editar track
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {track.title ?? "(sin título)"} —{" "}
            <span className="text-zinc-500">
              {track.artist ?? "(sin artista)"}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            ID: <span className="font-mono">{track.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de "Volver al listado" */}
          <Link
            href="/admin/analyze"
            className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
          >
            Volver al listado
          </Link>

          {/* Botones Analizar + Payload, reutilizando la lógica de /analyze */}
          <TrackAnalyzeHeaderButtons id={track.id} />
        </div>
      </header>

      {/* SECCIONES PRINCIPALES */}
      <div className="space-y-6">
        {/* 1. Audio / análisis técnico (AHORA PRIMERO) */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-50">
                Audio &amp; análisis técnico
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Player con waveform y métricas técnicas (LUFS, LRA, True Peak, duración, sample rate).
              </p>
            </div>
          </div>

          {/* Contenedor ÚNICO para el reproductor técnico */}
          {publicSrc ? (
            <PublicAudioBar
              src={publicSrc}
              durationSec={track.durationSec ?? 0}
              waveformB64={waveformB64 ?? undefined}
              interactive
            />
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-400">
              No hay <code>assetKey</code> ni <code>audioUrl</code> en este track.
            </div>
          )}

          {/* Métricas técnicas, más compactas */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Duración
              </div>
              <div className="text-xs text-zinc-50">
                {typeof track.durationSec === "number"
                  ? `${track.durationSec.toFixed(2)} s`
                  : "–"}
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Sample Rate
              </div>
              <div className="text-xs text-zinc-50">
                {track.sampleRateHz ? `${track.sampleRateHz} Hz` : "–"}
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Canales
              </div>
              <div className="text-xs text-zinc-50">
                {track.channels ?? "–"}
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Bitrate
              </div>
              <div className="text-xs text-zinc-50">
                {track.bitrateKbps ? `${track.bitrateKbps} kbps` : "–"}
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Loudness (I)
              </div>
              <div className="text-xs text-zinc-50">
                {typeof track.loudnessLufs === "number"
                  ? `${track.loudnessLufs.toFixed(2)} LUFS`
                  : "–"}
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                LRA
              </div>
              <div className="text-xs text-zinc-50">
                {typeof track.loudnessRangeLu === "number"
                  ? `${track.loudnessRangeLu.toFixed(2)} LU`
                  : "–"}
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                True Peak
              </div>
              <div className="text-xs text-zinc-50">
                {typeof track.truePeakDbfs === "number"
                  ? `${track.truePeakDbfs.toFixed(2)} dBFS`
                  : "–"}
              </div>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                Analizado
              </div>
              <div className="text-[11px] text-zinc-50">
                {track.analysisAt
                  ? new Date(track.analysisAt).toLocaleString()
                  : "–"}
              </div>
            </div>
          </div>

          {/* PayloadPanel ELIMINADO: ahora el payload se ve solo en el modal del header */}
        </section>

        {/* 2. Metadata creativa & identificadores */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="text-base font-semibold text-zinc-50">
            Metadata creativa &amp; identificadores
          </h2>
          <p className="mb-3 mt-1 text-xs text-zinc-400">
            Ajusta contenido creativo (título, artista, moods, usos) e identificadores
            industriales (ISRC, ISWC, UPC) desde un mismo panel.
          </p>

          {/* Creativo */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <CreativeForm
              key={
                track.updatedAt
                  ? new Date(track.updatedAt).toISOString()
                  : "no-updatedAt"
              }
              track={{
                id: track.id,
                title: track.title,
                artist: track.artist,
                moods: track.moods,
                uses: track.uses,
                updatedAt: track.updatedAt,
              }}
              updateCreative={updateCreative}
            />
          </div>

          {/* Identificadores */}
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <IdsForm
              track={{
                id: track.id,
                title: track.title,
                artist: track.artist,
                isrc: track.isrc,
                iswc: track.iswc,
                upc: track.upc,
                updatedAt: track.updatedAt,
              }}
              updateIds={updateIds}
            />
          </div>
        </section>

        {/* 3. Derechos / explotación */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="text-base font-semibold text-zinc-50">
            Derechos &amp; explotación
          </h2>
          <p className="mb-3 mt-1 text-xs text-zinc-400">
            Condiciones marco para sync/licensing: licencia, territorios, MFN, Content ID, etc.
          </p>

          <RightsFormClient
            track={{
              id: track.id,
              licenseType: track.licenseType ?? "",
              territories: track.territories ?? "",
              term: track.term ?? "",
              mediaBuy: track.mediaBuy ?? "",
              mfn: !!track.mfn,
              contentIdEnrolled: !!track.contentIdEnrolled,
              contentIdAdmin: track.contentIdAdmin ?? "",
              contentIdWhitelist: track.contentIdWhitelist ?? "",
              master: track.master ?? "",
              restrictionsStr,
              publishingSplitStr,
            }}
          />
        </section>
      </div>
    </main>
  );
}
