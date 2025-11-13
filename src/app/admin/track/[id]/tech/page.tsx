// src/app/admin/track/[id]/tech/page.tsx
import { prisma } from "@/server/prisma";
import { Actions } from "./ui/Actions.client";
import { Waveform } from "./ui/Waveform";
import PayloadPanel from "./ui/PayloadPanel.client";

export const dynamic = "force-dynamic";

function parseWaveformFlex(wf: unknown): number[] | null {
  if (!wf) return null;
  try {
    if (typeof wf === "string") {
      const arr = JSON.parse(wf);
      return Array.isArray(arr) ? arr : null;
    }
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(wf)) {
      const txt = (wf as Buffer).toString("utf8");
      const arr = JSON.parse(txt);
      return Array.isArray(arr) ? arr : null;
    }
    if (wf instanceof Uint8Array) {
      const dec = new TextDecoder();
      const txt = dec.decode(wf);
      const arr = JSON.parse(txt);
      return Array.isArray(arr) ? arr : null;
    }
    const maybe = wf as any;
    if (maybe && maybe.type === "Buffer" && Array.isArray(maybe.data)) {
      const u8 = Uint8Array.from(maybe.data);
      const dec = new TextDecoder();
      const txt = dec.decode(u8);
      const arr = JSON.parse(txt);
      return Array.isArray(arr) ? arr : null;
    }
    return null;
  } catch {
    return null;
  }
}

// 👇 params ahora es Promise y se await-ea
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const t = await prisma.track.findUnique({
    where: { id },
    select: {
      id: true, title: true, artist: true, audioUrl: true,
      durationSec: true, sampleRateHz: true, channels: true, bitrateKbps: true,
      loudnessLufs: true, loudnessRangeLu: true, truePeakDbfs: true,
      waveform: true, analysisAt: true, updatedAt: true, createdAt: true
    }
  });

  if (!t) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Track no encontrado</h1>
      </main>
    );
  }

  const wf = parseWaveformFlex(t.waveform);

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

      {t.audioUrl ? (
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-sm mb-2 text-zinc-400">Reproductor</p>
          <audio src={t.audioUrl} controls preload="none" className="w-full" />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-400">
          No hay <code>audioUrl</code> en este track.
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
          <div className="text-lg">{typeof t.loudnessLufs === "number" ? `${t.loudnessLufs} LUFS` : "–"}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Loudness Range</div>
          <div className="text-lg">{typeof t.loudnessRangeLu === "number" ? `${t.loudnessRangeLu} LU` : "–"}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">True Peak</div>
          <div className="text-lg">{typeof t.truePeakDbfs === "number" ? `${t.truePeakDbfs} dBFS` : "–"}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-500">Analizado</div>
          <div className="text-lg">{t.analysisAt ? new Date(t.analysisAt).toLocaleString() : "–"}</div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 p-4">
        <h2 className="text-sm text-zinc-400 mb-3">Waveform</h2>
        {wf && wf.length ? (
          <Waveform samples={wf} height={96} />
        ) : (
          <div className="text-sm text-zinc-400">
            No hay waveform válido almacenado. Usa <em>Analizar</em> o <em>Analizar + Normalizar</em>.
          </div>
        )}
      </section>

      {/* Panel de payload SIEMPRE al final */}
      <PayloadPanel endpoint={`/api/tracks/${t.id}/analyze`} />
    </main>
  );
}
