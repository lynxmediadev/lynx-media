/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/lib/audio/lufs.ts                                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Mide loudness según EBU R128 con FFmpeg (filtro `ebur128=peak=true`).     │
 * │ - Ofrece un fallback con `loudnorm` que devuelve JSON (1 ó 2 pasos).        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Primero intentamos `ebur128` (Summary textual).                           │
 * │ - Si vuelve con valores “sentinela” (I=-70, LRA=0, TP=-inf) o fuera de       │
 * │   rango, probamos `loudnorm` y aceptamos tanto `measured_*` (dos pasadas)    │
 * │   como `input_*` (una pasada).                                               │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { spawn } from "node:child_process";
import { getFfmpegPath } from "./paths";

/** Resultado “tipo ebur128” tras parsear el Summary de ffmpeg. */
export type EbuStats = {
  integratedLufs: number | null;   // I
  loudnessRangeLu: number | null;  // LRA (LU)
  lraLowLufs: number | null;       // LRA low (LUFS)
  lraHighLufs: number | null;      // LRA high (LUFS)
  truePeakDbfs: number | null;     // Peak (dBFS)
  rawSummary: string;              // bloque "Summary" textual (para debug)
};

/** Resultado del fallback con loudnorm (JSON). */
export type LoudnormStats = {
  integratedLufs: number | null;   // input_i o measured_I
  loudnessRangeLu: number | null;  // input_lra o measured_LRA
  truePeakDbfs: number | null;     // input_tp o measured_TP
  rawJson: string;                 // JSON crudo para debug
  source: "measured" | "input" | "unknown";
};

/** Ejecuta ffmpeg con ebur128=peak=true y parsea el Summary. */
export async function measureEbuLoudnessFromLocalPath(filePath: string): Promise<EbuStats> {
  const ffmpeg = getFfmpegPath(); // ← usamos tu helper real
  const args = [
    "-hide_banner", "-nostats",
    "-i", filePath,
    "-filter_complex", "ebur128=peak=true",
    "-f", "null", "-" // la “summary” aparece en stderr
  ];

  return await new Promise((resolve) => {
    const child = spawn(ffmpeg, args);
    let stderr = ""; let stdout = "";

    // ffmpeg escribe logs (incluida la summary) mayormente en stderr
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.stdout.on("data", (d) => { stdout += d.toString(); });

    child.on("close", () => {
      const rawSummary = stderr || stdout || "";

      // Helpers de parseo con RegExp ancladas al inicio de línea
      const pick = (re: RegExp): number | null => {
        const m = rawSummary.match(re);
        return m ? Number(m[1]) : null;
      };

      // Ejemplos de líneas en la summary:
      //   I:         -12.2 LUFS
      //   LRA:         4.6 LU
      //   LRA low:   -15.7 LUFS
      //   LRA high:  -11.2 LUFS
      //   Peak:       -0.2 dBFS
      resolve({
        integratedLufs: pick(/^\s*I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/m),
        loudnessRangeLu: pick(/^\s*LRA:\s*(-?\d+(?:\.\d+)?)\s*LU/m),
        lraLowLufs:     pick(/^\s*LRA low:\s*(-?\d+(?:\.\d+)?)\s*LUFS/m),
        lraHighLufs:    pick(/^\s*LRA high:\s*(-?\d+(?:\.\d+)?)\s*LUFS/m),
        truePeakDbfs:   pick(/^\s*Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/m), // no matchea "-inf"
        rawSummary,
      });
    });
  });
}

/**
 * Ejecuta ffmpeg con loudnorm y devuelve los valores del JSON.
 * Acepta tanto measured_* (dos pasadas) como input_* (una pasada).
 * Importante: en Windows el JSON puede salir por STDOUT o STDERR.
 */
export async function probeLoudnormFromLocalPath(filePath: string): Promise<LoudnormStats> {
  const ffmpeg = getFfmpegPath();
  const args = [
    "-hide_banner", "-nostats",
    "-i", filePath,
    // Solo queremos medir; los objetivos no importan para leer “input_*”
    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
    "-f", "null", "-"
  ];

  return await new Promise((resolve) => {
    const child = spawn(ffmpeg, args);
    let stderr = ""; const out: Buffer[] = [];

    child.stdout.on("data", (d) => out.push(Buffer.from(d))); // ← capturamos STDOUT
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", () => {
      const stdout = Buffer.concat(out).toString("utf8");

      // Extraemos el primer bloque JSON “{ ... }” (en stdout o stderr)
      const pickJson = (s: string) => {
        const a = s.indexOf("{"); const b = s.lastIndexOf("}");
        return a >= 0 && b > a ? s.slice(a, b + 1) : "";
      };
      const blob = pickJson(stdout) || pickJson(stderr);

      let obj: any = null;
      if (blob) {
        try { obj = JSON.parse(blob); } catch { obj = null; }
      }

      const num = (v: any): number | null => (v == null ? null : Number(v));

      // Preferimos measured_*; si no existen, usamos input_*
      const measuredI   = obj ? num(obj.measured_I)   : null;
      const measuredLRA = obj ? num(obj.measured_LRA) : null;
      const measuredTP  = obj ? num(obj.measured_TP)  : null;

      const inputI      = obj ? num(obj.input_i)      : null;
      const inputLRA    = obj ? num(obj.input_lra)    : null;
      const inputTP     = obj ? num(obj.input_tp)     : null;

      let source: LoudnormStats["source"] = "unknown";
      const integratedLufs = measuredI   ?? inputI   ?? null;
      const loudnessRangeLu = measuredLRA ?? inputLRA ?? null;
      const truePeakDbfs    = measuredTP  ?? inputTP  ?? null;

      if (measuredI != null || measuredLRA != null || measuredTP != null) source = "measured";
      else if (inputI != null || inputLRA != null || inputTP != null)     source = "input";

      resolve({
        integratedLufs,
        loudnessRangeLu,
        truePeakDbfs,
        rawJson: blob || (stdout || stderr),
        source,
      });
    });
  });
}
