"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/CopyLinkButton.tsx                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace (peras y manzanas)                                                 │
 * │ - Botón minimal para copiar al portapapeles la URL actual de la ficha.      │
 * │ - Feedback textual “Copiado” por ~1.5s.                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Cómo usar                                                                    │
 * │ - <CopyLinkButton className="..." /> en la cabecera/acciones del track.     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";
import { Link as LinkIcon, Check } from "lucide-react";

export default function CopyLinkButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No-op: en desktop moderno debería funcionar; si no, ignoramos.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 rounded-[2px] border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-sm transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      aria-label="Copiar enlace"
      title="Copiar enlace"
    >
      {copied ? <Check size={14} /> : <LinkIcon size={14} />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}
