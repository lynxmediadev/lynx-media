/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Admin · Analizar / Normalizar track                                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Input de ID de track                                                     │
 * │ - Botón “Analizar” que llama POST /api/tracks/:id/analyze                  │
 * │ - Checkbox “Normalizar asset (C3)” para enviar ?normalize=1                │
 * │ - Muestra resultado del análisis (C2) y, si aplica, los campos del asset   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ 1) Ve a /admin/analyze                                                     │
 * │ 2) Pega un ID de track real (existe en tu DB)                              │
 * │ 3) Marca “Normalizar asset (C3)” si quieres llenar assetKey/MIME/Size      │
 * │ 4) Pulsa “Analizar”                                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";
import { useState } from "react";

type ApiOut = {
  ok: boolean;
  updated?: any;
  warnings?: string[];
  debug?: any;
  normalized?: { id: string; assetKey: string; assetMime: string; assetSize: number } | { error: string } | null;
};

export default function Page() {
  const [id, setId] = useState("");
  const [normalize, setNormalize] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [out, setOut] = useState<ApiOut | null>(null);

  async function run() {
    setStatus("Llamando API...");
    setOut(null);
    try {
      const qs = normalize ? "?normalize=1" : "";
      const res = await fetch(`/api/tracks/${id}/analyze${qs}`, { method: "POST" });
      const j = await res.json();
      setOut(j);
      setStatus(res.ok ? "OK" : `Error HTTP ${res.status}`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? "falló la petición"}`);
    }
  }

  const normalized = out?.normalized && "assetKey" in (out.normalized as any) ? (out!.normalized as any) : null;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin · Analizar / Normalizar track</h1>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Track ID</label>
          <input
            className="w-full rounded-md border px-3 py-2 bg-transparent"
            placeholder="track id..."
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input id="normalize" type="checkbox" className="size-4" checked={normalize} onChange={e=>setNormalize(e.target.checked)} />
          <label htmlFor="normalize" className="text-sm">Normalizar asset (C3)</label>
        </div>
      </div>

      <button className="rounded-md border px-3 py-2" onClick={run} disabled={!id}>Analizar</button>

      <p className="text-sm"><strong>Estado:</strong> {status || "—"}</p>

      {normalized && (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-semibold mb-1">Asset normalizado</div>
          <div><span className="opacity-70">assetKey:</span> <code className="break-all">{normalized.assetKey}</code></div>
          <div><span className="opacity-70">assetMime:</span> <code>{normalized.assetMime}</code></div>
          <div><span className="opacity-70">assetSize:</span> <code>{normalized.assetSize}</code> <span className="opacity-70">(bytes)</span></div>
        </div>
      )}

      <pre className="text-xs whitespace-pre-wrap break-all rounded p-3 border">
        {out ? JSON.stringify(out, null, 2) : "—"}
      </pre>
    </main>
  );
}
