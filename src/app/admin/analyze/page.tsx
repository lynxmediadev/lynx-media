/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Admin · Analizar track                                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace:                                                                  │
 * │ - Input de id de track                                                      │
 * │ - Ejecuta POST /api/tracks/:id/analyze                                      │
 * │ - Muestra resultado (duración, LUFS, etc.)                                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                          │
 * │ - Visita /admin/analyze?key=TU_CLAVE                                       │
 * │ - Pega un id y pulsa “Analizar”                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
"use client";
import { useState } from "react";

export default function AdminAnalyzePage() {
  const [id, setId] = useState("");
  const [out, setOut] = useState<any>(null);
  const [status, setStatus] = useState("");

  async function run() {
    if (!id) return;
    setStatus("Analizando…");
    setOut(null);
    const res = await fetch(`/api/tracks/${id}/analyze`, { method: "POST" });
    const json = await res.json();
    setOut(json);
    setStatus(res.ok ? "OK" : "Error");
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin · Analizar track</h1>
      <input
        className="w-full rounded-md border px-3 py-2 bg-transparent"
        placeholder="Track id"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <button className="rounded-md border px-3 py-2" onClick={run} disabled={!id}>Analizar</button>
      <p className="text-sm"><strong>Estado:</strong> {status || "—"}</p>
      <pre className="text-xs whitespace-pre-wrap break-all bg-black/10 rounded p-3">{out ? JSON.stringify(out, null, 2) : "—"}</pre>
    </main>
  );
}
