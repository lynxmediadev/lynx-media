/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/track/[id]/page.tsx                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Página pública de un track con estética “cine”: minimal, clara y elegante.│
 * │ - Columna izquierda compacta con Player + waveform; derecha con metadatos.  │
 * │ - “Similar tracks” con un criterio simple (mood en común o recientes).      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Es Server Component (no hooks de cliente aquí).                            │
 * │ - Soporta que Next 15 entregue `params` como Promise → lo **await**eamos.    │
 * │ - Busca el track, arma la URL pública (assetKey→S3_PUBLIC_BASE_URL o audioUrl│
 * │   de fallback), convierte waveform (Bytes) a base64 para el componente de    │
 * │   cliente.                                                                   │
 * │ - No dependemos de cover/hero: mostramos un fondo sutil y tipografía fuerte. │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import PublicAudioBar from "@/components/public/PublicAudioBar";
// Si ya tienes esta utilidad, úsala; si no, usamos fallback más abajo.
import { getS3PublicUrl } from "@/lib/storage/s3";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

/** Helper “peras y manzanas”: convierte Buffer (Bytes) → base64 para el cliente */
function bytesToBase64(buf: Buffer | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

/** Helper: arma URL pública del asset con preferencia por assetKey → R2 */
function publicAudioUrl(input: {
  assetKey: string | null;
  audioUrl: string | null;
}): string | null {
  if (input.assetKey) return getS3PublicUrl(input.assetKey);
  return input.audioUrl ?? null;
}

/** Helper: mm:ss (clásico) */
function fmtDuration(sec: number | null): string {
  if (sec == null || !isFinite(sec)) return "—";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Pill simple para tags (moods/uses/restrictions) */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-800/80 bg-zinc-900/50 px-2 py-0.5 text-xs text-zinc-200">
      {children}
    </span>
  );
}

export default async function TrackPublicPage({ params }: PageProps) {
  // ⬇️ Next 15 puede pasar params como Promise → lo resolvemos
  const { id } =
    "then" in (params as any) ? await (params as Promise<{ id: string }>) : (params as { id: string });

  // 1) Cargamos datos del track necesarios para la página pública
  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      durationSec: true,
      assetKey: true,
      audioUrl: true,
      waveform: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      truePeakDbfs: true,
      moods: true,          // String[] | null
      uses: true,           // String[] | null
      restrictions: true,   // String[] | null
      updatedAt: true,
    },
  });

  if (!track) notFound();

  const src = publicAudioUrl({
    assetKey: track.assetKey,
    audioUrl: track.audioUrl,
  });
  const waveformB64 = bytesToBase64(track.waveform as unknown as Buffer | null);

  // 2) “Similar tracks”: intentamos por 1er mood; si no hay, recientes
  let similar = await db.track.findMany({
    where: track.moods?.length
      ? {
          id: { not: track.id },
          moods: { hasSome: [track.moods[0]!] },
        }
      : { id: { not: track.id } },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      artist: true,
      loudnessLufs: true,
      durationSec: true,
    },
  });

  // Fallback si quedara vacío
  if (!similar.length) {
    similar = await db.track.findMany({
      where: { id: { not: track.id } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        artist: true,
        loudnessLufs: true,
        durationSec: true,
      },
    });
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-black via-zinc-950 to-black text-zinc-100">
      {/* Banda superior minimal */}
      <header className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
            ← Volver
          </Link>
          <div className="text-[11px] text-zinc-500">
            Última actualización ·{" "}
            {new Date(track.updatedAt).toLocaleString()}
          </div>
        </div>
      </header>

      {/* Cuerpo: dos columnas; izquierda (player compacto), derecha (info) */}
      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 pb-16 md:grid-cols-[minmax(280px,380px),1fr]">
        {/* Columna izquierda (compact hero + player) */}
        <section
          className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur"
          aria-labelledby="track-hero"
        >
          <h1 id="track-hero" className="mb-1 text-xl font-semibold tracking-tight">
            {track.title ?? "Sin título"}
          </h1>
          <p className="mb-3 text-sm text-zinc-400">{track.artist ?? "Artista desconocido"}</p>

          {/* Player minimal + waveform (client) */}
          <PublicAudioBar
            src={src}
            durationSec={track.durationSec ?? 0}
            waveformB64={waveformB64}
          />

          {/* Métricas rápidas (sólo lectura) */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border border-zinc-800/60 bg-zinc-900/40 p-2">
              <div className="text-zinc-400">Duración</div>
              <div className="font-medium text-zinc-100">
                {fmtDuration(track.durationSec ?? 0)}
              </div>
            </div>
            <div className="rounded-md border border-zinc-800/60 bg-zinc-900/40 p-2">
              <div className="text-zinc-400">LUFS (I)</div>
              <div className="font-medium text-zinc-100">
                {track.loudnessLufs == null ? "—" : track.loudnessLufs.toFixed(2)}
              </div>
            </div>
            <div className="rounded-md border border-zinc-800/60 bg-zinc-900/40 p-2">
              <div className="text-zinc-400">True Peak</div>
              <div className="font-medium text-zinc-100">
                {track.truePeakDbfs == null ? "—" : track.truePeakDbfs.toFixed(2)} dBFS
              </div>
            </div>
          </div>
        </section>

        {/* Columna derecha (info clara para el cliente) */}
        <section className="space-y-6">
          {/* Bloque: información creativa/uso */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
            <h2 className="mb-3 text-lg font-medium">Descripción</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">Moods</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {(track.moods ?? []).length
                    ? track.moods!.map((m, i) => <Pill key={i}>{m}</Pill>)
                    : <span className="text-zinc-500">—</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">Usos sugeridos</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {(track.uses ?? []).length
                    ? track.uses!.map((u, i) => <Pill key={i}>{u}</Pill>)
                    : <span className="text-zinc-500">—</span>}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-zinc-400">Restricciones</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {(track.restrictions ?? []).length
                    ? track.restrictions!.map((r, i) => <Pill key={i}>{r}</Pill>)
                    : <span className="text-zinc-500">—</span>}
                </dd>
              </div>
            </dl>
          </div>

          {/* Bloque: licencias / CTA sencillo */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
            <h2 className="mb-3 text-lg font-medium">Licencias / contacto</h2>
            <p className="mb-3 text-sm text-zinc-400">
              ¿Te interesa usar esta pieza en un proyecto audiovisual? Hablemos.
              Cuéntame el **uso**, **territorios** y **plazos**, y te respondo con
              la licencia adecuada.
            </p>
            <Link
              href={`/contact?track=${encodeURIComponent(track.id)}`}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Solicitar licencia
            </Link>
          </div>

          {/* Similar tracks */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
            <h2 className="mb-3 text-lg font-medium">Piezas similares</h2>
            {similar.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay sugerencias por ahora.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {similar.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3 hover:bg-zinc-900/60"
                  >
                    <Link href={`/track/${s.id}`} className="block">
                      <div className="truncate text-sm font-medium text-zinc-100">
                        {s.title ?? "Sin título"}
                      </div>
                      <div className="truncate text-xs text-zinc-400">
                        {s.artist ?? "Artista desconocido"}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                        <span>{fmtDuration(s.durationSec ?? 0)}</span>
                        <span>·</span>
                        <span>
                          {s.loudnessLufs == null ? "—" : `${s.loudnessLufs.toFixed(1)} LUFS`}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
