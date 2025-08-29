/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Admin · Subir audio (Cloudflare R2) o usar URL                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Descripción                                                                 │
 * │ Página de administración mínima para ingestar audio:                        │
 * │  A) Firma + subida directa vía Presigned POST a R2                          │
 * │  B) Uso de una URL pública existente                                        │
 * │ Tras obtener un publicUrl, permite crear un Track llamando a POST /api/tracks│
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Llama a /api/uploads/sign con { fileName, mime, size, dir }               │
 * │ - Normaliza la URL firmada para evitar errores (R2: path vs host style)     │
 * │ - Ejecuta POST multipart a R2 con fields + file                             │
 * │ - Muestra publicUrl y crea Track (audio.url = publicUrl)                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ 1) Entra a /admin/uploads?key=TU_CLAVE (primera vez para setear cookie)     │
 * │ 2) Opción A: elige .mp3 → “Firmar y subir” → debe quedar “Subida OK”        │
 * │ 3) Opción B: pega una URL pública y pulsa “Usar URL”                        │
 * │ 4) Completa Title/Artist → “Crear Track”                                    │
 * │ 5) Verifica en /api/tracks?order=createdAt&dir=desc&view=list               │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";

import { useState } from "react";

type SignResp = {
  url: string;
  fields: Record<string, string>;
  assetKey: string;
  publicUrl: string;
  expiresIn: number;
};

type Created = { id: string };

/**
 * Normaliza una URL de Presigned POST de R2:
 * - Si viene en path-style (https://<ACCOUNT>.r2.cloudflarestorage.com/<bucket>),
 *   la convertimos a virtual-host style (https://<bucket>.<ACCOUNT>.r2.cloudflarestorage.com/).
 * - Si viene “duplicado” (bucket en host y también como primer segmento de path),
 *   removemos el segmento duplicado del path.
 */
function normalizeR2PresignedUrl(rawUrl: string, fields: Record<string, string>): string {
  try {
    const urlObj = new URL(rawUrl);
    const host = urlObj.hostname; // p.ej. "3f90....r2.cloudflarestorage.com" o "lynx-media-dev.3f90....r2.cloudflarestorage.com"
    const bucketFromFields = (fields?.bucket ?? "").trim();
    const pathSegs = urlObj.pathname.split("/").filter(Boolean); // ["lynx-media-dev", ...] o ["", ...]
    const hostFirstLabel = host.split(".")[0]; // "3f90..." o "lynx-media-dev"

    // Caso 1: path-style puro -> mover bucket al host
    if (bucketFromFields && pathSegs[0] === bucketFromFields && hostFirstLabel !== bucketFromFields) {
      urlObj.hostname = `${bucketFromFields}.${host}`;
      pathSegs.shift(); // quitar /<bucket>
      urlObj.pathname = "/" + pathSegs.join("/");
      return urlObj.toString();
    }

    // Caso 2: bucket duplicado (en host y también al inicio del path) -> quitar duplicado del path
    if (bucketFromFields && hostFirstLabel === bucketFromFields && pathSegs[0] === bucketFromFields) {
      pathSegs.shift();
      urlObj.pathname = "/" + pathSegs.join("/");
      return urlObj.toString();
    }

    // Caso 3: ya está correcto (virtual-host style sin duplicados)
    return urlObj.toString();
  } catch {
    return rawUrl;
  }
}

export default function AdminUploadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [manualUrl, setManualUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // ...
async function signAndUpload() {
  if (!file) return;
  setStatus("Firmando…");
  setPublicUrl("");

  try {
    // 1) Firmar
    const signRes = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mime: file.type,   // debe coincidir con el que se firmó (Content-Type)
        size: file.size,
        dir: "audio",
      }),
    });
    const signJson = await signRes.json().catch(() => ({}));
    if (!signRes.ok) {
      setStatus("Error firma: " + (signJson?.error ?? `${signRes.status} ${signRes.statusText}`));
      return;
    }

    // 2) Subida con PUT (sin FormData)
    setStatus("Subiendo…");
    const upRes = await fetch(signJson.url as string, {
      method: "PUT",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": file.type },
      body: file,
    }).catch((e) => {
      console.error("Upload network error:", e);
      return null;
    });

    if (!upRes) { setStatus("Error de red al subir (CORS o endpoint)"); return; }

    // Aceptamos 200/201/204
    if (![200, 201, 204].includes(upRes.status)) {
      const text = await upRes.text().catch(() => "");
      console.error("Upload failed:", upRes.status, text);
      setStatus(`Error subida: HTTP ${upRes.status} ${text || upRes.statusText}`);
      return;
    }

    setPublicUrl(String(signJson.publicUrl || ""));
    setStatus("Subida OK");
  } catch (e) {
    console.error(e);
    setStatus((e as Error)?.message ?? "Error desconocido");
  }
}
// ...


  function useUrl() {
    if (!manualUrl) return;
    setPublicUrl(manualUrl.trim());
    setStatus("Usando URL externa");
  }

  /**
 * ──────────────────────────────────────────────────────────────────────────────
 * Título: POST /api/tracks (payload mínimo y válido)
 * Qué hace: Envía sólo los campos requeridos por el schema (title, artist, audio.url).
 * Peras y manzanas: Evitamos coverUrl=null y arrays vacíos que provocan 400.
 * ──────────────────────────────────────────────────────────────────────────────
 */
async function createTrack() {
  if (!publicUrl || !title || !artist) {
    setStatus("Faltan: title, artist y publicUrl");
    return;
  }
  setStatus("Creando track…");

  const payload = {
    title,
    artist,
    audio: { url: publicUrl }, // ← requerido
    // Si a futuro agregas coverUrl/moods/uses, mándalos sólo cuando tengan valor
  };

  const res = await fetch("/api/tracks", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Mostrar detalles de Zod (si vienen)
    const issues = (json as any)?.issues
      ? " | issues: " + JSON.stringify((json as any).issues)
      : "";
    setStatus("Error creando track: " + ((json as any)?.error ?? `${res.status} ${res.statusText}`) + issues);
    return;
  }
  setStatus(`Track creado: id ${(json as any).id}`);
}


  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin · Subir audio (R2)</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">A) Subir archivo</h2>
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="rounded-md border px-3 py-2" onClick={signAndUpload} disabled={!file}>
          Firmar y subir
        </button>
        <p className="text-xs opacity-70">
          Tip: usa la app desde <code>http://localhost:3000</code>. Si la abres con la IP de red (p. ej.{" "}
          <code>http://192.168.x.x:3000</code>), añade ese origen en la CORS del bucket.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">B) Usar URL existente</h2>
        <input
          className="w-full rounded-md border px-3 py-2 bg-transparent"
          placeholder="https://…/mi-audio.mp3"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
        />
        <button className="rounded-md border px-3 py-2" onClick={useUrl} disabled={!manualUrl}>
          Usar URL
        </button>
      </section>

      <section className="space-y-2">
        <p className="text-sm">
          <strong>Estado:</strong> {status || "—"}
        </p>
        <p className="text-sm break-all">
          <strong>publicUrl:</strong>{" "}
          {publicUrl ? (
            <a className="underline" href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          ) : (
            "—"
          )}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Crear Track con este audio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Artist *"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>
        <button
          className="rounded-md border px-3 py-2"
          onClick={createTrack}
          disabled={!publicUrl || !title || !artist}
        >
          Crear Track
        </button>
      </section>
    </main>
  );
}
