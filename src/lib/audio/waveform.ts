/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/lib/audio/waveform.ts                                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Propósito                                                                  │
 * │ Generar un waveform NUMÉRICO compacto desde un archivo de audio local,     │
 * │ usando ffmpeg para emitir PCM crudo (mono, ~4kHz, 16-bit) y agregando      │
 * │ picos por ventanas hasta un tamaño fijo (por defecto, EXACTAMENTE 256).    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ Imagina la “silueta” del audio: bajamos a mono/4kHz y tomamos el pico por  │
 * │ segmentos uniformes para obtener 256 valores normalizados 0..1.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { spawn } from "node:child_process";
import { once } from "node:events";

export type WaveformOptions = {
  points?: number;     // resolución final (default 256)
  sampleRate?: number; // SR destino (default 4000 Hz)
  channels?: 1;        // forzado a mono
};

function bufferToInt16(buf: Buffer): Int16Array {
  const samples = buf.length >> 1; // /2
  const out = new Int16Array(samples);
  for (let i = 0, j = 0; i < samples; i++, j += 2) out[i] = buf.readInt16LE(j);
  return out;
}

/**
 * Downsamplea tomando el pico absoluto por “bins” uniformes.
 * Importante: devuelve EXACTAMENTE `target` puntos (rellena con el último si hiciera falta).
 */
function downsamplePeakAbsExact(int16: Int16Array, target: number): number[] {
  if (int16.length === 0 || target <= 0) return [];
  const n = int16.length;
  const out = new Array<number>(target);
  let globalMax = 1;

  for (let b = 0; b < target; b++) {
    const start = Math.floor((b * n) / target);
    const end   = Math.floor(((b + 1) * n) / target);
    let localMax = 0;
    for (let i = start; i < Math.max(end, start + 1); i++) {
      const v = Math.abs(int16[Math.min(i, n - 1)]);
      if (v > localMax) localMax = v;
    }
    out[b] = localMax;
    if (localMax > globalMax) globalMax = localMax;
  }

  const norm = 1 / globalMax;
  for (let i = 0; i < out.length; i++) out[i] = Math.min(1, Math.max(0, out[i] * norm));
  return out;
}

/**
 * Genera waveform desde archivo local usando ffmpeg para emitir PCM s16le.
 * Retorna array [0..1] de longitud EXACTA = points.
 */
export async function computeWaveformFromFile(
  filePath: string,
  ffmpegPath: string,
  opts: WaveformOptions = {}
): Promise<number[]> {
  const points = opts.points ?? 256;
  const sampleRate = opts.sampleRate ?? 4000;

  const args = [
    "-hide_banner", "-nostats",
    "-i", filePath,
    "-vn",
    "-ac", "1",
    "-ar", String(sampleRate),
    "-f", "s16le",
    "-"
  ];

  const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  const chunks: Buffer[] = [];
  let failed = false;
  proc.on("error", () => { failed = true; });
  proc.stdout.on("data", (c: Buffer) => chunks.push(c));

  const [code] = (await once(proc, "close")) as [number];
  if (failed || code !== 0) return [];

  const buf = Buffer.concat(chunks);
  const i16 = bufferToInt16(buf);
  return downsamplePeakAbsExact(i16, points);
}
