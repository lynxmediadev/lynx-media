/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/ui/CopyButton.tsx                                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Botón cliente para copiar un texto al portapapeles con mensaje de éxito.  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Usa `navigator.clipboard.writeText` y, si falla, un fallback con <textarea│
 * │   temporal.                                                                 │
 * │ - Cambia su etiqueta a "Copiado!" por 1.5s para dar feedback al usuario.    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import React from "react";

type Props = {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

export default function CopyButton({ text, label = "Copiar", className = "", size = "sm" }: Props) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback clásico
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No tiramos error al usuario final; podría estar bloqueado por permisos
      setCopied(false);
    }
  }

  const base =
    size === "sm"
      ? "px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50"
      : "px-3 py-1.5 text-sm rounded border bg-white hover:bg-gray-50";

  return (
    <button
      type="button"
      onClick={copy}
      className={`${base} ${className} border-gray-300 text-gray-700`}
      aria-live="polite"
    >
      {copied ? "¡Copiado!" : label}
    </button>
  );
}
