/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/audio/QualityBadges.tsx                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Muestra badges de calidad para LUFS (I), LRA y True Peak con colores      │
 * │   por umbral y tooltips explicativos.                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Este componente es puramente visual; NO usa hooks ni estado.              │
 * │ - Cada badge es un contenedor `relative group` que muestra un tooltip       │
 * │   posicionado **arriba** del badge (bottom-full) y con **mb-2** de espacio. │
 * │ - Para evitar que el tooltip “quede atrás” del badge o del mouse:           │
 * │     • `z-50` + `drop-shadow-lg` en el tooltip.                              │
 * │     • `pointer-events-none` para no interferir con el hover.                │
 * │ - Accesibilidad: `tabIndex={0}` en el badge para que se pueda enfocar,      │
 * │   y el tooltip también aparece con `group-focus-visible`.                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import React from "react";

export type LufsSource = "ebur128" | "loudnorm" | "unknown";

export default function QualityBadges(props: {
  lufs: number | null;
  lra: number | null;
  tp: number | null;
  lraLow?: number | null;
  lraHigh?: number | null;
  lufsSource?: LufsSource;
}) {
  const { lufs, lra, tp, lufsSource = "unknown" } = props;

  // Helpers: clasificar por umbrales y construir copia para tooltip
  const lufsInfo = classifyLUFS(lufs);
  const lraInfo = classifyLRA(lra);
  const tpInfo = classifyTP(tp);

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {/* LUFS */}
      <Badge label="LUFS" value={formatMaybe(lufs)} intent={lufsInfo.intent} tooltip={lufsInfo.tooltip} />

      {/* LRA */}
      <Badge label="LRA" value={formatMaybe(lra)} intent={lraInfo.intent} tooltip={lraInfo.tooltip} />

      {/* True Peak */}
      <Badge label="TP" value={formatMaybe(tp)} intent={tpInfo.intent} tooltip={tpInfo.tooltip} />

      {/* Fuente LUFS */}
      <span className="ml-2 text-xs text-gray-500">
        Fuente LUFS: <code>{lufsSource}</code>
      </span>

      {/* Bounds visibles si vinieron con EBU */}
      {props.lraLow != null || props.lraHigh != null ? (
        <span className="text-xs text-gray-500">
          {" · "}LRA low/high: {props.lraLow ?? "N/A"} / {props.lraHigh ?? "N/A"}
        </span>
      ) : null}
    </div>
  );
}

/* ============================
 *  Umbrales y helpers
 * ============================ */

type Intent = "good" | "warn" | "bad" | "muted";

function classifyLUFS(v: number | null | undefined): { intent: Intent; tooltip: string } {
  if (v == null || !isFinite(v)) return { intent: "muted", tooltip: "Sin dato de LUFS integrado (I)." };
  // Verde [-16,-13], Ámbar [-18,-16) o (-13,-9], Rojo < -18 o > -9
  if (v >= -16 && v <= -13) {
    return {
      intent: "good",
      tooltip: "LUFS en rango razonable para streaming (~-14 LUFS).",
    };
  }
  if ((v >= -18 && v < -16) || (v > -13 && v <= -9)) {
    return {
      intent: "warn",
      tooltip: "LUFS fuera del ideal. Considera ajustar hacia ~-14 LUFS.",
    };
  }
  return {
    intent: "bad",
    tooltip: "LUFS demasiado bajo/alto para streaming. Riesgo de normalización agresiva.",
  };
}

function classifyLRA(v: number | null | undefined): { intent: Intent; tooltip: string } {
  if (v == null || !isFinite(v)) return { intent: "muted", tooltip: "Sin dato de LRA." };
  // Verde [4,14], Ámbar (2,4) o (14,18], Rojo <2 o >18
  if (v >= 4 && v <= 14) {
    return { intent: "good", tooltip: "Rango de sonoridad saludable (dinámica balanceada)." };
  }
  if ((v > 2 && v < 4) || (v > 14 && v <= 18)) {
    return { intent: "warn", tooltip: "Rango algo bajo/alto. Revisa compresión o arreglos." };
  }
  return { intent: "bad", tooltip: "Rango extremo (muy comprimido o muy dinámico)." };
}

function classifyTP(v: number | null | undefined): { intent: Intent; tooltip: string } {
  if (v == null || !isFinite(v)) return { intent: "muted", tooltip: "Sin dato de True Peak." };
  // Verde ≤ -1.0, Ámbar (-1.0,-0.3], Rojo > -0.3
  if (v <= -1.0) {
    return { intent: "good", tooltip: "Buen margen de True Peak (≤ -1.0 dBFS)." };
  }
  if (v > -1.0 && v <= -0.3) {
    return { intent: "warn", tooltip: "Margen reducido. Considera dejar ≤ -1.0 dBFS." };
  }
  return { intent: "bad", tooltip: "Riesgo de inter-sample clipping (> -0.3 dBFS)." };
}

function formatMaybe(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "N/A";
  return `${Number(v).toFixed(2)}`;
}

/* ============================
 *  UI: Badge con tooltip mejorado
 * ============================ */

function Badge(props: { label: string; value: string; intent: Intent; tooltip: string }) {
  const color = intentColor(props.intent);
  return (
    <span
      className={`relative group inline-flex items-center gap-1 px-2 py-1 rounded ${color.bg} ${color.text} text-xs outline-none`}
      tabIndex={0} // permite foco por teclado para ver tooltip
      aria-describedby={`${props.label}-tip`}
    >
      <strong className="font-medium">{props.label}</strong>
      <span>{props.value}</span>

      {/* Tooltip (arriba, centrado, con z-50 y sombra) */}
      <span
        id={`${props.label}-tip`}
        role="tooltip"
        className={`
          pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 translate-y-1
          opacity-0 group-hover:opacity-100 group-hover:translate-y-0
          group-focus-visible:opacity-100 group-focus-visible:translate-y-0
          transition ease-out duration-150
          z-50 mb-2 px-2 py-1 rounded bg-black text-white text-[11px] whitespace-nowrap drop-shadow-lg
        `}
      >
        {props.tooltip}

        {/* Flechita (arrow) abajo del tooltip */}
        <span
          aria-hidden
          className="
            pointer-events-none absolute top-full left-1/2 -translate-x-1/2
            w-0 h-0 border-l-4 border-r-4 border-t-4
            border-l-transparent border-r-transparent border-t-black
          "
        />
      </span>
    </span>
  );
}

function intentColor(intent: Intent) {
  switch (intent) {
    case "good":
      return { bg: "bg-emerald-100", text: "text-emerald-900" };
    case "warn":
      return { bg: "bg-amber-100", text: "text-amber-900" };
    case "bad":
      return { bg: "bg-rose-100", text: "text-rose-900" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700" };
  }
}
