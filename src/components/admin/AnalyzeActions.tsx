// src/components/admin/AnalyzeActions.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: AnalyzeActions + TrackAnalyzeHeaderButtons                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Encapsula la lógica de análisis técnico de un track:                    │
 * │     • POST /api/tracks/[id]/analyze                                        │
 * │     • guarda el payload JSON                                               │
 * │     • refresca la UI vía router.refresh()                                  │
 * │     • muestra un modal con el JSON (botón "Payload")                       │
 * │ - Exporta dos componentes de UI:                                           │
 * │     1) default AnalyzeActions → para /admin/tracks (tabla)                 │
 * │        - Botones: Analizar, Payload, Ver track                             │
 * │     2) TrackAnalyzeHeaderButtons → para /admin/track/[id]/edit (header)    │
 * │        - Botones: Analizar, Payload (sin "Ver track")                      │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type BaseProps = {
  id: string;
  className?: string;
};

type TrackAnalysisHook = {
  busy: boolean;
  error: string | null;
  isBrowser: boolean;
  isModalOpen: boolean;
  lastPayload: any | null;
  trackUrl: string;
  handleAnalyze: () => Promise<void>;
  handleOpenPayload: () => void;
  handleClosePayload: () => void;
};

/**
 * Hook compartido con toda la lógica de análisis/payload.
 */
function useTrackAnalysisActions(id: string): TrackAnalysisHook {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [lastPayload, setLastPayload] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isBrowser, setIsBrowser] = React.useState(false);

  const busy = isLoading || isPending;

  React.useEffect(() => {
    setIsBrowser(true);
  }, []);

  const trackUrl = `/admin/track/${encodeURIComponent(id)}/edit`;

  async function handleAnalyze() {
    if (busy) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/tracks/${encodeURIComponent(id)}/analyze`, {
        method: "POST",
      });

      const json = await res.json().catch(() => null);
      (globalThis as any).__lynx_last_payload = json;

      if (!res.ok || !json?.ok) {
        console.error("[AnalyzeActions] fallo:", json);
        setError("Error al analizar. Revisa consola/servidor.");
      } else {
        setLastPayload(json);
        setError(null);

        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err) {
      console.error("[AnalyzeActions] excepción:", err);
      setError("Excepción en el análisis. Revisa consola/servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenPayload() {
    if (!lastPayload && (globalThis as any).__lynx_last_payload) {
      setLastPayload((globalThis as any).__lynx_last_payload);
    }
    setIsModalOpen(true);
  }

  function handleClosePayload() {
    setIsModalOpen(false);
  }

  return {
    busy,
    error,
    isBrowser,
    isModalOpen,
    lastPayload,
    trackUrl,
    handleAnalyze,
    handleOpenPayload,
    handleClosePayload,
  };
}

type PayloadModalProps = {
  json: any | null;
  onClose: () => void;
  trackUrl?: string;
  showViewTrack?: boolean;
};

/**
 * Modal centrado con el JSON de análisis.
 */
function PayloadModal({
  json,
  onClose,
  trackUrl,
  showViewTrack = true,
}: PayloadModalProps) {
  const pretty = json ? JSON.stringify(json, null, 2) : "// Sin payload aún.";

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleCopy() {
    if (!json) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    } catch (err) {
      console.error("[PayloadModal] error al copiar:", err);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleOverlayClick}
    >
      <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-50">
            Payload último análisis
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            JSON crudo retornado por /api/tracks/[id]/analyze.
          </p>
        </header>

        <div className="max-h-[56vh] overflow-auto px-4 py-3">
          <pre className="whitespace-pre-wrap rounded bg-zinc-900 p-3 text-xs text-zinc-100">
            {pretty}
          </pre>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
            >
              Copiar JSON
            </button>

            {showViewTrack && trackUrl && (
              <Link
                href={trackUrl}
                className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
              >
                Ver track
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Componente original para /admin/tracks (tabla).
 * - Botones: Analizar, Payload, Ver track
 */
export default function AnalyzeActions({ id, className = "" }: BaseProps) {
  const {
    busy,
    error,
    isBrowser,
    isModalOpen,
    lastPayload,
    trackUrl,
    handleAnalyze,
    handleOpenPayload,
    handleClosePayload,
  } = useTrackAnalysisActions(id);

  if (!isBrowser) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          disabled
          className="h-8 w-24 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500"
        >
          …
        </button>
        <button
          type="button"
          disabled
          className="h-8 w-24 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500"
        >
          …
        </button>
        <button
          type="button"
          disabled
          className="h-8 w-24 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500"
        >
          …
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={busy}
          className="inline-flex h-8 w-24 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Analizando…" : "Analizar"}
        </button>

        <button
          type="button"
          onClick={handleOpenPayload}
          className="inline-flex h-8 w-24 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
        >
          Payload
        </button>

        <Link
          href={trackUrl}
          className="inline-flex h-8 w-24 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800 text-center"
        >
          Ver track
        </Link>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}

      {isBrowser &&
        isModalOpen &&
        createPortal(
          <PayloadModal
            json={lastPayload}
            onClose={handleClosePayload}
            trackUrl={trackUrl}
            showViewTrack={true}
          />,
          document.body,
        )}
    </>
  );
}

/**
 * Componente para el HEADER de /admin/track/[id]/edit.
 * - Botones: Analizar + Payload (sin "Ver track").
 */
export function TrackAnalyzeHeaderButtons({
  id,
  className = "",
}: BaseProps) {
  const {
    busy,
    error,
    isBrowser,
    isModalOpen,
    lastPayload,
    trackUrl,
    handleAnalyze,
    handleOpenPayload,
    handleClosePayload,
  } = useTrackAnalysisActions(id);

  if (!isBrowser) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          disabled
          className="h-8 w-24 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500"
        >
          …
        </button>
        <button
          type="button"
          disabled
          className="h-8 w-24 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500"
        >
          …
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={busy}
          className="inline-flex h-8 w-24 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Analizando…" : "Analizar"}
        </button>

        <button
          type="button"
          onClick={handleOpenPayload}
          className="inline-flex h-8 w-24 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
        >
          Payload
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}

      {isBrowser &&
        isModalOpen &&
        createPortal(
          <PayloadModal
            json={lastPayload}
            onClose={handleClosePayload}
            trackUrl={trackUrl}
            showViewTrack={false}
          />,
          document.body,
        )}
    </>
  );
}
