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
 * │ - Optimización: NO hace preflight automático al montar.                    │
 * │   Solo valida presencia de audioUrl en cliente y analiza bajo demanda.     │
 * │ - Exporta dos componentes de UI:                                           │
 * │     1) default AnalyzeActions → para /admin/tracks (tabla)                 │
 * │        - Botones: Analizar, Payload, Ver track                             │
 * │     2) TrackAnalyzeHeaderButtons → para /admin/tracks/[id]/edit (header)   │
 * │        - Botones: Analizar, Payload (sin "Ver track")                      │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ExternalLink, FileText, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BaseProps = {
  id: string;
  audioUrl?: string | null;
  className?: string;
  iconOnly?: boolean;
};

type TrackAnalysisHook = {
  busy: boolean;
  canAnalyze: boolean;
  error: string | null;
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
function useTrackAnalysisActions(
  id: string,
  audioUrl?: string | null,
): TrackAnalysisHook {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [lastPayload, setLastPayload] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const canAnalyze = typeof audioUrl === "string" && audioUrl.trim().length > 0;

  const busy = isLoading || isPending;

  const trackUrl = `/admin/tracks/${encodeURIComponent(id)}/edit`;

  async function handleAnalyze() {
    if (busy) return;
    if (!canAnalyze) {
      setError("Audio URL vacío.");
      return;
    }

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
        const detail = json?.error ? `Error al analizar: ${json.error}` : null;
        setError(detail ?? "Error al analizar. Revisa consola/servidor.");
      } else {
        setLastPayload(json);
        setError(null);

        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err) {
      console.error("[AnalyzeActions] excepción:", err);
      const detail = err instanceof Error ? err.message : null;
      setError(detail ? `Excepción en el análisis: ${detail}` : "Excepción en el análisis. Revisa consola/servidor.");
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
    canAnalyze,
    error,
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
      <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Payload último análisis
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            JSON crudo retornado por /api/tracks/[id]/analyze.
          </p>
        </header>

        <div className="max-h-[56vh] overflow-auto px-4 py-3">
          <pre className="whitespace-pre-wrap rounded bg-muted/60 p-3 text-xs text-foreground">
            {pretty}
          </pre>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Copiar JSON
            </Button>

            {showViewTrack && trackUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Link href={trackUrl}>Ver track</Link>
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Cerrar
          </Button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Componente original para /admin/tracks (tabla).
 * - Botones: Analizar, Payload, Ver track
 */
export default function AnalyzeActions({
  id,
  audioUrl,
  className = "",
  iconOnly = false,
}: BaseProps) {
  const {
    busy,
    canAnalyze,
    error,
    isModalOpen,
    lastPayload,
    trackUrl,
    handleAnalyze,
    handleOpenPayload,
    handleClosePayload,
  } = useTrackAnalysisActions(id, audioUrl);

  return (
    <>
      <div className={cn("inline-flex items-center gap-2", className)}>
        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={busy || !canAnalyze}
          variant="outline"
          size="sm"
          className={iconOnly ? "h-8 w-8 px-0" : "h-8 w-24 text-xs"}
          title={busy ? "Analizando" : !canAnalyze ? "Sin audio" : "Analizar"}
          aria-label={busy ? "Analizando" : !canAnalyze ? "Sin audio" : "Analizar"}
        >
          {iconOnly ? (
            busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Search className="h-3.5 w-3.5" aria-hidden="true" />
          ) : busy ? (
            "Analizando…"
          ) : !canAnalyze ? (
            "Sin audio"
          ) : (
            "Analizar"
          )}
        </Button>

        <Button
          type="button"
          onClick={handleOpenPayload}
          variant="outline"
          size="sm"
          className={iconOnly ? "h-8 w-8 px-0" : "h-8 w-24 text-xs"}
          title="Payload"
          aria-label="Payload"
        >
          {iconOnly ? <FileText className="h-3.5 w-3.5" aria-hidden="true" /> : "Payload"}
        </Button>

        <Button
          asChild
          variant="outline"
          size="sm"
          className={iconOnly ? "h-8 w-8 px-0 text-center" : "h-8 w-24 text-xs text-center"}
          title="Ver track"
          aria-label="Ver track"
        >
          <Link href={trackUrl}>
            {iconOnly ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : "Ver track"}
          </Link>
        </Button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}

      {typeof document !== "undefined" &&
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
 * Componente para el HEADER de /admin/tracks/[id]/edit.
 * - Botones: Analizar + Payload (sin "Ver track").
 */
export function TrackAnalyzeHeaderButtons({
  id,
  audioUrl,
  className = "",
}: BaseProps) {
  const {
    busy,
    canAnalyze,
    error,
    isModalOpen,
    lastPayload,
    trackUrl,
    handleAnalyze,
    handleOpenPayload,
    handleClosePayload,
  } = useTrackAnalysisActions(id, audioUrl);

  return (
    <>
      <div className={cn("flex w-full flex-wrap items-center gap-2 sm:w-auto", className)}>
        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={busy || !canAnalyze}
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs sm:w-24"
        >
          {busy ? "Analizando…" : !canAnalyze ? "Sin audio" : "Analizar"}
        </Button>

        <Button
          type="button"
          onClick={handleOpenPayload}
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs sm:w-24"
        >
          Payload
        </Button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}

      {typeof document !== "undefined" &&
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
