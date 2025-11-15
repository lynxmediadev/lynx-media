// src/app/admin/track/[id]/tech/page.tsx
import { prisma } from "@/server/prisma";
import { Actions } from "./ui/Actions.client";
import PublicAudioBar from "@/components/public/PublicAudioBar";
import PayloadPanel from "./ui/PayloadPanel.client";
import { getS3PublicUrl } from "@/lib/storage/s3";

export const dynamic = "force-dynamic";

/** Buffer(Bytes) → base64 para el waveform del player técnico */
function bytesToBase64(buf: Buffer | Uint8Array | null): string | null {
  if (!buf) return null;
  // Buffer.from soporta Buffer y TypedArray (Uint8Array, etc.)
  return Buffer.from(buf).toString("base64");
}

/** Prefiere assetKey→R2; si no, usa audioUrl como fallback */
function publicAudioUrl(input: { assetKey: string | null; audioUrl: string | null }): string | null {
  if (input.assetKey) return getS3PublicUrl(input.assetKey);
  return input.audioUrl ?? null;
}

// 👇 params ahora es Promise y se await-ea
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const t = await prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      assetKey: true,
      durationSec: true,
      sampleRateHz: true,
      channels: true,
      bitrateKbps: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      truePeakDbfs: true,
      waveform: true,
      analysisAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (!t) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Track no encontrado</h1>
      </main>
    );
  }

  // URL pública del audio (R2 si hay assetKey, si no, audioUrl directa)
  const src = publicAudioUrl({
    assetKey: (t as any).assetKey ?? null,
    audioUrl: t.audioUrl,
  });

  // Waveform como base64 para el reproductor técnico (mismo formato que la página pública)
  const waveformB64 = bytesToBase64(t.waveform as any);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.title ?? "(sin título)"}</h1>
          <p className="text-sm text-zinc-500">
            {t.artist ?? "(sin artista)"} — <span className="text-xs">ID: {t.id}</span>
          </p>
        </div>
        <Actions trackId={t.id} />
      </header>

      {src ? (
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-sm mb-2 text-zinc-400">Reproductor técnico</p>
          <PublicAudioBar
            src={src}
            durationSec={t.durationSec ?? 0}
            waveformB64={waveformB64}
            interactive
          />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-400">
          No hay <code>assetKey</code> ni <code>audioUrl</code> en este track.
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Duración</div>
          <div className="text-lg">{t.durationSec ?? "–"} s</div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Sample Rate</div>
          <div className="text-lg">{t.sampleRateHz ?? "–"} Hz</div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Canales</div>
          <div className="text-lg">{t.channels ?? "–"}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Bitrate</div>
          <div className="text-lg">{t.bitrateKbps ?? "–"} kbps</div>
        </div>

        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Loudness (I)</div>
          <div className="text-lg">
            {typeof t.loudnessLufs === "number" ? `${t.loudnessLufs} LUFS` : "–"}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Loudness Range</div>
          <div className="text-lg">
            {typeof t.loudnessRangeLu === "number" ? `${t.loudnessRangeLu} LU` : "–"}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">True Peak</div>
          <div className="text-lg">
            {typeof t.truePeakDbfs === "number" ? `${t.truePeakDbfs} dBFS` : "–"}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Analizado</div>
          <div className="text-lg">
            {t.analysisAt ? new Date(t.analysisAt).toLocaleString() : "–"}
          </div>
        </div>
      </section>

      {/* Panel de payload SIEMPRE al final */}
      <PayloadPanel endpoint={`/api/tracks/${t.id}/analyze`} />
    </main>
  );
}
