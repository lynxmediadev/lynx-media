// src/app/admin/track/[id]/edit/page.tsx
/**
 * Editor unificado de track (admin)
 *
 * Ruta:
 *   - /admin/track/[id]/edit
 *
 * Unifica:
 *   • Audio & análisis técnico (player + métricas).
 *   • Metadata creativa (título, artista, moods, usos).
 *   • Identificadores (ISRC / ISWC / UPC).
 *   • Derechos & explotación (incluye Publishing split).
 *
 * Peras y manzanas:
 * - Es la “ficha completa” del track.
 * - Desde aquí puedes revisar casi todo lo relevante del track.
 * - Usa Server Actions por sección (creative, IDs, derechos).
 */

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { db } from "@/server/db";
import PublicAudioBar from "@/components/public/PublicAudioBar";
import CreativeForm from "@/components/admin/track/CreativeForm";
import IdsForm from "@/components/admin/track/IdsForm";
import RightsFormClient from "@/components/admin/track/RightsFormClient";
import { getS3PublicUrl } from "@/lib/storage/s3";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { DeleteTrackButton } from "@/components/admin/track/DeleteTrackButton.client";
import { deleteObjectFromS3 } from "@/lib/storage/delete-object";

export const dynamic = "force-dynamic";

type Params = { id: string } | Promise<{ id: string }>;

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
        .filter((s) => s.length > 0),
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

/**
 * Parser unificado de Publishing Split.
 *
 * Formato esperado (JSON):
 * {
 *   "writer": { "name": "X", "sharePct": 50 },
 *   "publisher": { "name": "Y", "sharePct": 50 }
 * }
 *
 * Peras y manzanas:
 * - Toma el string JSON de `Track.publishingSplit`.
 * - Extrae siempre 4 valores normalizados para el formulario:
 *   writerName, writerSharePct, publisherName, publisherSharePct.
 * - Si el valor es legacy o no parseable, devuelve strings vacíos y nulls.
 */
function parsePublishingSplit(raw: string | null) {
  let writerName = "";
  let writerSharePct: number | null = null;
  let publisherName = "";
  let publisherSharePct: number | null = null;

  if (!raw) {
    return { writerName, writerSharePct, publisherName, publisherSharePct };
  }

  try {
    const parsed = JSON.parse(raw) as any;
    if (parsed && typeof parsed === "object") {
      if (parsed.writer && typeof parsed.writer === "object") {
        if (typeof parsed.writer.name === "string") {
          writerName = parsed.writer.name;
        }
        if (
          typeof parsed.writer.sharePct === "number" &&
          Number.isFinite(parsed.writer.sharePct)
        ) {
          writerSharePct = parsed.writer.sharePct;
        }
      }
      if (parsed.publisher && typeof parsed.publisher === "object") {
        if (typeof parsed.publisher.name === "string") {
          publisherName = parsed.publisher.name;
        }
        if (
          typeof parsed.publisher.sharePct === "number" &&
          Number.isFinite(parsed.publisher.sharePct)
        ) {
          publisherSharePct = parsed.publisher.sharePct;
        }
      }
    }
  } catch {
    // Valor legacy en texto libre: ignorado a nivel estructurado.
  }

  return { writerName, writerSharePct, publisherName, publisherSharePct };
}

export default async function AdminTrackEditPage({
  params,
}: {
  params: Params;
}) {
  // Soporta params síncrono y Promise (patrón Next 15)
  const p =
    "then" in (params as any)
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
      licenseType: true,
      territories: true,
      term: true,
      mediaBuy: true,
      mfn: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
      restrictions: true,

      // Publishing (guardado como string o JSON, según schema)
      // publishingSplit: true,
      publishingShares: {
        select: {
          role: true,
          name: true,
          ipiNumber: true,
          sharePct: true,
        },
      },
    },
  });

  if (!track) {
    notFound();
  }

  const publicSrc = track.assetKey
    ? getS3PublicUrl(track.assetKey)
    : (track.audioUrl ?? null);

  const waveformB64 = track.waveform
    ? bytesToBase64(track.waveform as any)
    : null;

  const restrictionsStr = (track.restrictions ?? []).join("\n");

  const primaryWriter =
    track.publishingShares.find((s) => s.role === "WRITER") ?? null;

  const primaryPublisher =
    track.publishingShares.find((s) => s.role === "PUBLISHER") ?? null;

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
      revalidatePath(`/admin/analyze`);

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
      revalidatePath(`/admin/analyze`);

      return { ok: true, message: "Identificadores actualizados" };
    } catch (err) {
      console.error("[track:edit:updateIds] fatal:", err);
      return { ok: false, message: "Error al guardar" };
    }
  }

  /**
   * Server Action para eliminar track.
   *
   * Peras y manzanas:
   * - La invoca el <form action={deleteAction}> del DeleteTrackButton.
   * - Lee id/assetKey/coverUrl desde el FormData.
   * - Elimina el registro en BD.
   * - Intenta borrar el asset en R2 (si hay assetKey).
   * - Luego revalida y hace redirect a /admin/analyze.
   */
  async function deleteTrackAction(formData: FormData) {
    "use server";

    const idFromForm = formData.get("id");
    const assetKey = (formData.get("assetKey") as string | null) || null;
    const coverUrl = (formData.get("coverUrl") as string | null) || null;

    if (!idFromForm || typeof idFromForm !== "string") {
      console.error(
        "[track:edit:deleteTrackAction] id inválido en FormData",
        idFromForm,
      );
      return;
    }

    try {
      // 1) Eliminar de BD
      await db.track.delete({
        where: { id: idFromForm },
      });

      // 2) Intentar borrar asset en R2/S3 (no rompe si falla)
      const r2Result = await deleteObjectFromS3(assetKey);
      console.log("[track:edit:deleteTrackAction] deleteObjectFromS3", {
        assetKey,
        coverUrl,
        result: r2Result,
      });
    } catch (err) {
      console.error("[track:edit:deleteTrackAction] fatal:", err, {
        idFromForm,
        assetKey,
        coverUrl,
      });
      // Si algo falla aquí, no intentamos redirigir
      return;
    }

    // 3) Revalidar y REDIRIGIR (fuera del try/catch para no atrapar NEXT_REDIRECT)
    revalidatePath("/admin/analyze");
    redirect("/admin/analyze");
  }

  // Flag simple: ¿tenemos análisis técnico?
  const techHasAnalysis =
    track.loudnessLufs !== null ||
    track.loudnessRangeLu !== null ||
    track.truePeakDbfs !== null ||
    track.analysisAt !== null;

  return (
    <main className="mx-auto w-[80vw] max-w-7xl space-y-6 p-4">
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col gap-3 border-b border-zinc-800 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Editar track</h1>
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

        <div className="flex flex-wrap items-center gap-2">
          <DeleteTrackButton
            trackId={track.id}
            trackTitle={track.title}
            deleteAction={deleteTrackAction}
            assetKey={track.assetKey}
            coverUrl={track.coverUrl}
          />
          <TrackAnalyzeHeaderButtons id={track.id} />
          <Link
            href="/admin/analyze"
            className="rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
          >
            Volver al listado
          </Link>
        </div>
      </header>

      {/* SECCIONES PRINCIPALES */}
      <div className="space-y-6">
        {/* 1. Audio / análisis técnico — layout 2 columnas */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* Izquierda: Player + ficha básica */}
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-50">
                  Audio &amp; análisis técnico
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Player con waveform y datos técnicos base del archivo
                  (duración, sample rate, canales, bitrate).
                </p>
              </div>
            </div>

            {publicSrc ? (
              <PublicAudioBar
                src={publicSrc}
                waveformB64={waveformB64}
                title={track.title ?? "(sin título)"}
                artist={track.artist ?? "(sin artista)"}
                durationSec={track.durationSec ?? undefined}
                sampleRateHz={track.sampleRateHz ?? undefined}
                channels={track.channels ?? undefined}
                bitrateKbps={track.bitrateKbps ?? undefined}
                dense
              />
            ) : (
              <p className="rounded-md border border-amber-500/40 bg-amber-900/10 p-2 text-xs text-amber-200">
                No hay audio asociado a este track. Sube un archivo desde la
                sección de creación o análisis.
              </p>
            )}

            {/* Identificadores clave (solo lectura) */}
            {/* <div className="mt-2 grid gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 p-2">
              <div>
                <div className="text-[11px] tracking-wide text-zinc-500 uppercase">
                  ISRC
                </div>
                <div className="font-mono text-xs break-all text-zinc-100">
                  {track.isrc ?? "—"}
                </div>
              </div>
            </div> */}

            {/* Ficha técnica básica del archivo */}
            <div className="grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-zinc-200 md:grid-cols-4">
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
                <div className="text-[10px] tracking-wide text-zinc-500 uppercase">
                  ISRC
                </div>
                <div className="">{(track.isrc ?? "—").trim().toUpperCase()}</div>
              </div>

              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
                <div className="text-[10px] tracking-wide text-zinc-500 uppercase">
                  ISWC
                </div>
                <div className="">{(track.iswc ?? "—").trim().toUpperCase()}</div>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
                <div className="text-[10px] tracking-wide text-zinc-500 uppercase">
                  TIPO DE LICENCIA
                </div>
                <div className="">{(track.licenseType ?? "—").trim().toUpperCase()}</div>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
                <div className="text-[10px] tracking-wide text-zinc-500 uppercase">
                  COMPOSITOR
                </div>
                <div className="">{(primaryWriter?.name ?? "—").trim().toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Derecha: Resumen técnico (LUFS, LRA, True Peak) */}
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-300">
            <h2 className="text-sm font-semibold text-zinc-50">
              Resumen técnico
            </h2>

            {techHasAnalysis ? (
              <dl className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-[11px] font-black text-zinc-400">
                    Loudness (I)
                  </dt>
                  <dd className="font-mono text-xs">
                    {typeof track.loudnessLufs === "number"
                      ? `${track.loudnessLufs.toFixed(2)} LUFS`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-500">Loudness Range</dt>
                  <dd className="font-mono text-xs">
                    {typeof track.loudnessRangeLu === "number"
                      ? `${track.loudnessRangeLu.toFixed(2)} LU`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-500">True Peak</dt>
                  <dd className="font-mono text-xs">
                    {typeof track.truePeakDbfs === "number"
                      ? `${track.truePeakDbfs.toFixed(2)} dBFS`
                      : "–"}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] text-zinc-500">Duración</dt>
                  <dd className="font-mono text-xs">
                    {typeof track.durationSec === "number"
                      ? `${track.durationSec.toFixed(2)} s`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-500">Sample Rate</dt>
                  <dd className="font-mono text-xs">
                    {typeof track.sampleRateHz === "number"
                      ? `${track.sampleRateHz.toFixed(2)} Hz`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-500">Bitrate</dt>
                  <dd className="font-mono text-xs">
                    {typeof track.bitrateKbps === "number"
                      ? `${track.bitrateKbps.toFixed(2)} kbps`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-500">Último análisis</dt>
                  <dd className="font-mono text-[11px]">
                    {track.analysisAt
                      ? new Date(track.analysisAt).toLocaleString()
                      : "–"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-[11px] text-zinc-400">
                Aún no se ha realizado análisis técnico para este track. Usa el
                botón{" "}
                <span className="font-semibold text-zinc-200">“Analizar”</span>{" "}
                en el header superior para generar métricas de loudness (LUFS),
                rango (LRA) y True Peak.
              </p>
            )}

            <p className="text-[11px] text-zinc-500">
              Para ver el detalle completo del análisis (histograma de loudness,
              métricas avanzadas, etc.), ve a{" "}
              <Link
                href={`/admin/track/${track.id}/tech`}
                className="text-emerald-400 underline underline-offset-2"
              >
                ficha técnica
              </Link>
              .
            </p>
          </div>
        </section>

        {/* 2. Metadata creativa & identificadores & derechos */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="text-base font-semibold text-zinc-50">
            Metadata creativa &amp; identificadores
          </h2>
          <p className="mt-1 mb-3 text-xs text-zinc-400">
            Ajusta contenido creativo (título, artista, moods, usos) e
            identificadores industriales (ISRC, ISWC, UPC), junto con los
            derechos de explotación y publishing, desde un mismo panel.
          </p>

          {/* Creative */}
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
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <IdsForm
              track={{
                id: track.id,
                isrc: track.isrc,
                iswc: track.iswc,
                upc: track.upc,
                updatedAt: track.updatedAt,
              }}
              updateIds={updateIds}
            />
          </div>

          {/* Derechos & explotación (incluye Publishing split) */}
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
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

                // PUBLISHING
                writerName: primaryWriter?.name ?? "",
                writerSharePct: primaryWriter?.sharePct ?? null,
                writerIpiNumber: primaryWriter?.ipiNumber ?? "",

                publisherName: primaryPublisher?.name ?? "",
                publisherSharePct: primaryPublisher?.sharePct ?? null,
                publisherIpiNumber: primaryPublisher?.ipiNumber ?? "",
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
