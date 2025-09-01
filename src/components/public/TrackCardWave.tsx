"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/TrackCardWave.tsx                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Mostrar una forma de onda "pro" dentro de cada tarjeta del catálogo,      │
 * │   usando **la misma estética** que el player público de la ficha.           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Es un wrapper muy delgado sobre tu WaveformScrubber.                      │
 * │ - Aquí no reproducimos audio; sólo render estático (progress=0).            │
 * │ - Usamos las mismas props clave: barWidth=4, gap=0, colores como en ficha.  │
 * │ - Si en el futuro quieres progreso en tarjetas, bastaría pasar `progress`.  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import WaveformScrubber from "@/components/public/WaveformScrubber";

export default function TrackCardWave({
  waveformB64,
  durationSec = 0,
  className = "",
  height = 64,
}: {
  waveformB64: string | null;
  durationSec?: number;
  className?: string;
  height?: number;
}) {
  // progress=0 porque en catálogo no estamos reproduciendo
  const progress = 0;

  return (
    <div className={`rounded-md bg-zinc-950/40 ring-1 ring-zinc-800 ${className}`}>
      <WaveformScrubber
        waveformB64={waveformB64}
        durationSec={durationSec}
        height={height}
        progress={progress}
        // Misma estética que en el player público:
        barWidth={4}
        gap={0}
        colors={{ base: "rgba(255,255,255,0.18)", progress: "#fff" }}
        // Sin onSeek: aquí es un preview estático (no interactivo)
      />
    </div>
  );
}
