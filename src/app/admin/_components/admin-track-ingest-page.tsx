/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Admin · Ingesta de audio + creación de Track                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Flujo unificado:                                                           │
 * │  - A) Subir archivo a Cloudflare R2 (Presigned PUT)                        │
 * │  - B) Usar URL pública de audio                                            │
 * │ Luego crea un Track vía POST /api/tracks con audio.url = publicUrl         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";

import { useState } from "react";

type SignResp = {
  url: string;
  method: "PUT";
  headers?: Record<string, string>;
  assetKey: string;
  publicUrl: string;
  expiresIn: number;
};

type Created = { id: string };

function parseCSV(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function AdminTrackIngestPage() {
  // Origen del audio
  const [file, setFile] = useState<File | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [manualUrl, setManualUrl] = useState<string>("");

  // Metadata del track
  const [title, setTitle] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("/images/hero/hero-bg-1.png");
  const [moodsCSV, setMoodsCSV] = useState<string>("Epic,Emotional,Elegant");
  const [usesCSV, setUsesCSV] = useState<string>("TV,Cine,Publicidad");

  // Estado / debug
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [echo, setEcho] = useState<any | null>(null);

  /**
   * Paso 1: Firma + subida directa por PUT a R2
   */
  async function signAndUpload() {
    if (!file) {
      setStatus("Selecciona un archivo de audio primero.");
      return;
    }

    setStatus("Firmando URL de subida…");
    setIsUploading(true);
    setCreated(null);
    setEcho(null);
    setPublicUrl("");

    try {
      // 1) Solicitar firma
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mime: file.type || "audio/mpeg", // debe coincidir con el firmado
          size: file.size,
          dir: "audio",
        }),
      });

      const signJson = (await signRes.json().catch(() => ({}))) as Partial<SignResp> & {
        error?: string;
      };

      if (!signRes.ok) {
        setStatus(
          "Error firma: " +
            (signJson?.error ?? `${signRes.status} ${signRes.statusText}`)
        );
        return;
      }

      if (!signJson.url) {
        setStatus("La firma no devolvió una URL válida.");
        return;
      }

      // 2) Subir con PUT directo (sin FormData)
      setStatus("Subiendo a R2…");

      const upRes = await fetch(signJson.url as string, {
        method: "PUT",
        mode: "cors",
        credentials: "omit",
        headers: {
          "Content-Type": file.type || "audio/mpeg",
          // si quisieras confiar en signJson.headers:
          // ...(signJson.headers ?? {}),
        },
        body: file,
      }).catch((e) => {
        console.error("Upload network error:", e);
        return null;
      });

      if (!upRes) {
        setStatus("Error de red al subir (CORS o endpoint).");
        return;
      }

      // Aceptamos 200/201/204 como éxito
      if (![200, 201, 204].includes(upRes.status)) {
        const text = await upRes.text().catch(() => "");
        console.error("Upload failed:", upRes.status, text);
        setStatus(
          `Error subida: HTTP ${upRes.status} ${text || upRes.statusText}`
        );
        return;
      }

      const finalUrl = String(signJson.publicUrl || "");
      if (!finalUrl) {
        setStatus("Subida OK, pero no llegó publicUrl desde la API.");
        return;
      }

      setPublicUrl(finalUrl);
      setManualUrl(finalUrl);
      setStatus("Subida OK. URL de audio lista para crear Track.");
    } catch (err) {
      console.error(err);
      setStatus(
        err instanceof Error
          ? err.message
          : "Error desconocido al firmar/subir archivo."
      );
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Paso 1 alternativa: usar una URL externa manual
   */
  function useManualAudioUrl() {
    const trimmed = manualUrl.trim();
    if (!trimmed) {
      setStatus("Pega primero una URL pública de audio.");
      return;
    }
    setPublicUrl(trimmed);
    setStatus("Usando URL manual como audio.url.");
  }

  /**
   * Paso 2: Crear Track en el backend
   */
  async function createTrack() {
    if (!publicUrl) {
      setStatus("Falta URL de audio. Sube un archivo o usa una URL pública.");
      return;
    }
    if (!title.trim() || !artist.trim()) {
      setStatus("Faltan title y/o artist.");
      return;
    }

    setIsCreating(true);
    setStatus("Creando track…");
    setCreated(null);

    const moods = parseCSV(moodsCSV);
    const uses = parseCSV(usesCSV);

    const payload: any = {
      title: title.trim(),
      artist: artist.trim(),
      audio: { url: publicUrl },
    };

    if (coverUrl.trim()) payload.coverUrl = coverUrl.trim();
    if (moods.length) payload.moods = moods;
    if (uses.length) payload.uses = uses;

    setEcho(payload);

    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (json && (json.error || json.message)) ||
          `Error al crear track: HTTP ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      setCreated(json as Created);
      setStatus(
        `Track creado correctamente (id: ${(json as any).id ?? "desconocido"})`
      );
    } catch (err) {
      console.error(err);
      setStatus(
        err instanceof Error
          ? err.message
          : "Error desconocido al crear track."
      );
    } finally {
      setIsCreating(false);
    }
  }

  const disableCreate =
    !publicUrl || !title.trim() || !artist.trim() || isCreating;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          Admin · Ingesta de audio &amp; creación de Track
        </h1>
        <p className="text-sm text-muted-foreground">
          Flujo unificado para subir audio (Cloudflare R2) o usar una URL
          pública y luego crear un Track.
        </p>
      </header>

      {/* Origen del audio */}
      <section className="space-y-4 rounded-md border p-4">
        <h2 className="text-lg font-semibold">1. Origen del audio</h2>

        <div className="space-y-2">
          <p className="text-sm font-medium">A) Subir archivo a Cloudflare R2</p>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            onClick={signAndUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? "Subiendo…" : "Firmar y subir"}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">B) Usar una URL pública de audio</p>
          <input
            type="url"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="https://tus-assets.com/audio/tema-001.mp3"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            onClick={useManualAudioUrl}
          >
            Usar URL
          </button>
        </div>

        <div className="rounded-md bg-muted p-3 text-xs">
          <p className="font-medium">URL de audio seleccionada:</p>
          <p className="break-all">
            {publicUrl || "— aún no definida —"}
          </p>
        </div>
      </section>

      {/* Metadata del track */}
      <section className="space-y-4 rounded-md border p-4">
        <h2 className="text-lg font-semibold">2. Metadata del Track</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Title *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Epic Strings 001"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Artist *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Lynx Media"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Cover URL (opcional)
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Moods (CSV, opcional)
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={moodsCSV}
              onChange={(e) => setMoodsCSV(e.target.value)}
              placeholder="Epic,Emotional,Elegant"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium">
              Uses (CSV, opcional)
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={usesCSV}
              onChange={(e) => setUsesCSV(e.target.value)}
              placeholder="TV,Cine,Publicidad"
            />
          </div>
        </div>

        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium"
          onClick={createTrack}
          disabled={disableCreate}
        >
          {isCreating ? "Creando…" : "Crear Track"}
        </button>
      </section>

      {/* Estado y debug */}
      <section className="space-y-3">
        {status ? (
          <div className="rounded-md border border-dashed p-3 text-xs">
            <p className="font-medium">Estado:</p>
            <p>{status}</p>
          </div>
        ) : null}

        {created ? (
          <div className="rounded-md border p-3 text-xs">
            <p className="font-medium">Track creado</p>
            <p>
              ID: <span className="font-mono">{created.id}</span>
            </p>
          </div>
        ) : null}

        {echo ? (
          <details className="rounded-md border p-3 text-xs">
            <summary className="cursor-pointer font-medium">
              Payload enviado a /api/tracks
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto text-[11px]">
              {JSON.stringify(echo, null, 2)}
            </pre>
          </details>
        ) : null}
      </section>
    </main>
  );
}
