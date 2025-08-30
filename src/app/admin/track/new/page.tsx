/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Admin mínimo · Crear Track                                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Formulario simple para crear un track llamando a POST /api/tracks.       │
 * │ - Campos: title, artist, audio.url, coverUrl, moods CSV, uses CSV.         │
 * │ - Transforma CSV -> string[] y muestra el ID creado.                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Accede con /admin/tracks/new?key=TU_CLAVE (solo la primera vez).         │
 * │ - Completa campos mínimos y “Crear”.                                       │
 * │ - Verás el ID y un resumen del payload enviado.                            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";

import { useState } from "react";

type Created = { id: string };

function parseCSV(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function AdminCreateTrackPage() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioUrl, setAudioUrl] = useState("/audio/demo.mp3");
  const [coverUrl, setCoverUrl] = useState("/images/hero/hero-bg-1.png");
  const [moodsCSV, setMoodsCSV] = useState("Epic,Emotional,Elegant");
  const [usesCSV, setUsesCSV] = useState("TV,Cine,Publicidad");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [echo, setEcho] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setCreated(null);

    const payload = {
      title: title.trim(),
      artist: artist.trim(),
      audio: { url: audioUrl.trim() }, // ← coincide con trackCreateSchema
      coverUrl: coverUrl.trim() || null,
      moods: parseCSV(moodsCSV),
      uses: parseCSV(usesCSV),
    };

    setEcho(payload);

    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as Created | { error: string; issues?: unknown };
      if (!res.ok) {
        const msg =
          (json as any)?.error ||
          `HTTP ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      setCreated(json as Created);
      // Limpia mínimos si quieres seguir cargando
      // setTitle(""); setArtist("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin · Crear Track</h1>
      <p className="text-sm opacity-80">
        Primera vez: entra con <code>?key=TU_CLAVE</code> en la URL para habilitar el acceso.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Epic Orchestral"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Artist *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Lynx Music Collective"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Audio URL *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="/audio/demo.mp3"
            required
          />
          <p className="text-xs opacity-70">Se envía como <code>{`{ audio: { url } }`}</code>.</p>
        </div>

        <div>
          <label className="text-sm font-medium">Cover URL</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="/images/cover.png"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Moods (CSV)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
            value={moodsCSV}
            onChange={(e) => setMoodsCSV(e.target.value)}
            placeholder="Epic,Emotional,Elegant"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Uses (CSV)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
            value={usesCSV}
            onChange={(e) => setUsesCSV(e.target.value)}
            placeholder="TV,Cine,Publicidad"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-md border px-4 py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando…" : "Crear"}
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-500">Error: {error}</p> : null}

      {created ? (
        <div className="rounded-md border p-4">
          <p className="text-sm"><strong>Creado ID:</strong> {created.id}</p>
        </div>
      ) : null}

      {echo ? (
        <details className="rounded-md border p-4">
          <summary className="cursor-pointer text-sm font-medium">Payload enviado</summary>
          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(echo, null, 2)}</pre>
        </details>
      ) : null}
    </main>
  );
}
