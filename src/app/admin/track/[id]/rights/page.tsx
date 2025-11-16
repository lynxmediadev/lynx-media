// src/app/admin/track/[id]/rights/page.tsx
/**
 * Editor específico de "Derechos & explotación" de un track.
 *
 * Ruta:
 *   - /admin/track/[id]/rights
 *
 * Peras y manzanas:
 * - Es una vista más focalizada que /edit, centrada solo en los campos
 *   de derechos/licensing.
 * - Reutiliza el componente RightsFormClient, compartiendo lógica con /edit.
 */

import { notFound } from "next/navigation";
import { db } from "@/server/db";
import RightsFormClient from "@/components/admin/track/RightsFormClient";

export const dynamic = "force-dynamic";

type Params = { id: string } | Promise<{ id: string }>;

/**
 * Mismo parser de publishingSplit que en /edit.
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

export default async function AdminTrackRightsPage({
  params,
}: {
  params: Params;
}) {
  const p =
    "then" in (params as any)
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string });

  const { id } = p;

  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      licenseType: true,
      territories: true,
      term: true,
      mediaBuy: true,
      mfn: true,
      master: true,
      publishingSplit: true,
      restrictions: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
    },
  });

  if (!track) {
    notFound();
  }

  const restrictionsStr = (track.restrictions ?? []).join("\n");
  const {
    writerName,
    writerSharePct,
    publisherName,
    publisherSharePct,
  } = parsePublishingSplit(track.publishingSplit ?? null);

  return (
    <main className="mx-auto w-[80vw] max-w-3xl p-4 space-y-4">
      <header className="border-b border-zinc-800 pb-3">
        <h1 className="text-lg font-semibold text-zinc-50">
          Derechos &amp; explotación
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
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
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
            writerName,
            writerSharePct,
            publisherName,
            publisherSharePct,
          }}
        />
      </section>
    </main>
  );
}
