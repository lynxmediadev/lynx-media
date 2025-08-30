// src/lib/audio/lufs.ts
// Medición EBU R128 a partir de un archivo local usando ffmpeg (ebur128=peak=true)

import { spawn } from "node:child_process";
import { resolveFfmpegPath } from "./paths";

export type EbuStats = {
  integratedLufs: number | null;   // I
  loudnessRangeLu: number | null;  // LRA (LU)
  lraLowLufs: number | null;       // LRA low (LUFS)
  lraHighLufs: number | null;      // LRA high (LUFS)
  truePeakDbfs: number | null;     // Peak (dBFS)
  rawSummary: string;              // bloque "Summary" textual de ffmpeg
};

export async function measureEbuLoudnessFromLocalPath(filePath: string): Promise<EbuStats> {
  const ffmpeg = resolveFfmpegPath();

  const args = [
    "-nostdin",
    "-hide_banner",
    "-nostats",
    "-vn",
    "-sn",
    "-dn",
    "-i",
    filePath,
    "-af",
    "ebur128=peak=true",
    "-f",
    "null",
    process.platform === "win32" ? "NUL" : "/dev/null",
  ];

  return new Promise<EbuStats>((resolve, reject) => {
    const child = spawn(ffmpeg, args);
    let stderr = "";
    let stdout = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      reject(Object.assign(new Error(`ffmpeg spawn failed: ${e.message}`), { ffmpegPath: ffmpeg }));
    });
    child.on("close", () => {
      // Extraer el bloque "Summary" (lo imprime en stderr)
      const summaryIdx = stderr.indexOf("Summary:");
      const rawSummary = summaryIdx >= 0 ? stderr.slice(summaryIdx) : stderr;

      const pick = (re: RegExp): number | null => {
        const m = rawSummary.match(re);
        if (!m) return null;
        const n = Number(m[1]);
        return Number.isFinite(n) ? n : null;
      };

      const integratedLufs = pick(/^\s*I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/m);
      const loudnessRangeLu = pick(/^\s*LRA:\s*(\d+(?:\.\d+)?)\s*LU/m);
      const lraLowLufs = pick(/^\s*LRA low:\s*(-?\d+(?:\.\d+)?)\s*LUFS/m);
      const lraHighLufs = pick(/^\s*LRA high:\s*(-?\d+(?:\.\d+)?)\s*LUFS/m);
      const truePeakDbfs = pick(/^\s*Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/m);

      resolve({
        integratedLufs,
        loudnessRangeLu,
        lraLowLufs,
        lraHighLufs,
        truePeakDbfs,
        rawSummary,
      });
    });
  });
}
