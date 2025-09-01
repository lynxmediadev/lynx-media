/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/audio/LinkedWaveform.tsx                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Renderiza <Sparkline/> y permite navegar: click → seek en <audio>.        │
 * │ - Dibuja línea guía vertical bajo el cursor.                                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import * as React from "react";
import Sparkline from "@/components/audio/Sparkline";

type Props = {
  base64: string;
  durationSec: number | null | undefined;
  audioElementId: string; // id del <audio> público
  height?: number;
  className?: string;
};

export default function LinkedWaveform({
  base64,
  durationSec,
  audioElementId,
  height = 84,
  className = "",
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [x, setX] = React.useState<number | null>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = Math.min(Math.max(0, e.clientX - r.left), r.width);
    setX(nx);
  }
  function onLeave() {
    setX(null);
  }
  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !durationSec || durationSec <= 0) return;
    const r = el.getBoundingClientRect();
    const nx = Math.min(Math.max(0, e.clientX - r.left), r.width);
    const ratio = nx / r.width;
    const audio = document.getElementById(audioElementId) as HTMLAudioElement | null;
    if (audio) {
      audio.currentTime = ratio * durationSec;
      void audio.play().catch(() => {});
    }
  }

  return (
    <div
      ref={ref}
      className={`relative select-none rounded-lg border border-white/10 bg-white/5 p-2 ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      role="slider"
      aria-label="Navegar por la forma de onda"
    >
      <Sparkline base64={base64} height={height} className="rounded-md" />
      {x !== null && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-2 w-px bg-white/60"
          style={{ left: `${x + 8}px` }} // + padding-x (p-2)
        />
      )}
    </div>
  );
}
