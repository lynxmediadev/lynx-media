"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = { trackId: string };

export function Actions({ trackId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastPayload, setLastPayload] = useState<any | null>(null);

  async function callAnalyze(normalize: boolean) {
    setLastPayload(null);

    try {
      const endpoint = `/api/tracks/${encodeURIComponent(trackId)}/analyze${normalize ? "?normalize=1" : ""}`;
      const res = await fetch(endpoint, { method: "POST" });

      let data: any = null;
      try { data = await res.json(); } catch { /* noop */ }

      // 👉 publica global para el panel fijo
      (window as any).__lynx_last_payload = data;
      if (typeof (window as any).__lynx_set_payload === "function") {
        (window as any).__lynx_set_payload(data);
      }

      if (!res.ok || !data?.ok) {
        console.error("Analyze failed", data ?? {});
        setLastPayload(data ?? { ok: false });
        return;
      }

      setLastPayload(data);
      startTransition(() => router.refresh());
    } catch (e) {
      console.error("Analyze failed (excepción de red)", e);
      const data = { ok: false, error: String(e) };
      (window as any).__lynx_last_payload = data;
      if (typeof (window as any).__lynx_set_payload === "function") {
        (window as any).__lynx_set_payload(data);
      }
      setLastPayload(data);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-md border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800 disabled:opacity-50"
        disabled={pending}
        onClick={() => callAnalyze(false)}
      >
        {pending ? "Analizando…" : "Analizar"}
      </button>
      <button
        className="rounded-md border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800 disabled:opacity-50"
        disabled={pending}
        onClick={() => callAnalyze(true)}
      >
        {pending ? "Normalizando…" : "Analizar + Normalizar"}
      </button>
    </div>
  );
}
