"use client";

type Props = {
  samples: number[]; // 0..1
  width?: number;
  height?: number;
};

export function Waveform({ samples, width = 800, height = 96 }: Props) {
  const N = samples?.length ?? 0;
  if (!N) {
    return <div className="text-sm text-zinc-500">Sin samples.</div>;
  }

  const pad = 2;
  const w = width;
  const h = height;
  const mid = h / 2;

  const step = (w - pad * 2) / N;

  const path = samples.map((v, i) => {
    const x = pad + i * step;
    const y = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0)) * (h / 2 - 2);
    // barra vertical tipo "minibar"
    return `M${x.toFixed(1)},${(mid - y).toFixed(1)} L${x.toFixed(1)},${(mid + y).toFixed(1)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label="waveform">
      <rect x="0" y="0" width={w} height={h} fill="none" />
      <path d={path} stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-zinc-300" />
      <line x1="0" y1={mid} x2={w} y2={mid} stroke="currentColor" strokeOpacity="0.15" />
    </svg>
  );
}
