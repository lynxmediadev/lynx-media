"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** endpoint informativo (opcional) */
  endpoint?: string;
};

/**
 * Muestra SIEMPRE un panel al final de la página para depuración.
 * Escucha los eventos `window.__lynx_last_payload = {...}` que setea Actions o la route.
 * Incluye botón "Copiar JSON".
 */
export default function PayloadPanel({ endpoint }: Props) {
  const [data, setData] = useState<any | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // si alguna parte de la UI quiere publicar el último payload:
    (window as any).__lynx_set_payload = (p: any) => setData(p);
    // si ya había algo:
    if ((window as any).__lynx_last_payload) {
      setData((window as any).__lynx_last_payload);
    }
  }, []);

  const str = data ? JSON.stringify(data, null, 2) : "";

  return (
    <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950/50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="text-sm text-zinc-400">
          Payload debug {endpoint ? <span className="text-zinc-600">({endpoint})</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800 disabled:opacity-50"
            onClick={() => {
              if (!str) return;
              navigator.clipboard.writeText(str).catch(() => {
                // fallback
                ref.current?.select();
                document.execCommand("copy");
              });
            }}
            disabled={!str}
          >
            Copiar JSON
          </button>
          <button
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
            onClick={() => setData(null)}
          >
            Limpiar
          </button>
        </div>
      </div>
      <div className="p-3">
        {str ? (
          <textarea
            ref={ref}
            className="w-full h-56 resize-y bg-transparent outline-none text-xs text-zinc-200"
            defaultValue={str}
          />
        ) : (
          <div className="text-xs text-zinc-600">Sin payload aún. Ejecuta “Analizar” para poblarlo.</div>
        )}
      </div>
    </section>
  );
}
