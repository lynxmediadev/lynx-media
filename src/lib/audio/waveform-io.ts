/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/lib/audio/waveform-io.ts                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Propósito                                                                  │
 * │ Guardar/leer el waveform en columna Prisma tipo Bytes. Usamos Float32 LE.  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
export function encodeWaveformF32(values: number[]): Buffer {
  const f32 = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    f32[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return Buffer.from(f32.buffer);
}

export function decodeWaveformF32(buf: Buffer): number[] {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const f32 = new Float32Array(ab);
  const out = new Array<number>(f32.length);
  for (let i = 0; i < f32.length; i++) out[i] = f32[i];
  return out;
}
