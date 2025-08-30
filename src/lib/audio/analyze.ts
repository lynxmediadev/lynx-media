// src/lib/audio/analyze.ts
// Descarga, ffprobe (dur, SR, ch, bitrate) y ebur128 (I, LRA, low/high, TP).
// Guarda en Prisma y devuelve resultado + warnings + debug (en dev).

import { db } from "@/server/db";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { promises as fsp } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { measureEbuLoudnessFromLocalPath } from "./lufs";
import { resolveFfprobePath, resolveFfmpegPath } from "./paths";

type ProbeResult = {
  durationSec: number | null;
  sampleRateHz: number | null;
  channels: number | null;
  bitrateKbps: number | null;
  raw?: string;
};

async function downloadToTemp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = join(tmpdir(), `lynx-${randomUUID()}.mp3`);
  await fsp.writeFile(tmp, buf);
  return tmp;
}

function runFfprobeJson(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const bin = resolveFfprobePath();
    const args = ["-v", "error", "-of", "json", "-show_format", "-show_streams", filePath];
    const child = spawn(bin, args);
    let out = "";
    let err = "";

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => {
      reject(Object.assign(new Error(`ffprobe spawn failed: ${e.message}`), { ffprobePath: bin }));
    });
    child.on("close", () => {
      try {
        const j = JSON.parse(out);
        const aStream = (j.streams || []).find((s: any) => s.codec_type === "audio") || {};
        const fmt = j.format || {};
        const durationSec = fmt.duration ? Math.round(Number(fmt.duration)) : null;
        const sampleRateHz = aStream.sample_rate ? Number(aStream.sample_rate) : null;
        const channels = Number.isFinite(Number(aStream.channels)) ? Number(aStream.channels) : null;
        const bitrateKbps = aStream.bit_rate
          ? Math.round(Number(aStream.bit_rate) / 1000)
          : fmt.bit_rate
          ? Math.round(Number(fmt.bit_rate) / 1000)
          : null;

        resolve({ durationSec, sampleRateHz, channels, bitrateKbps, raw: out });
      } catch (e: any) {
        reject(
          Object.assign(new Error(`ffprobe parse error: ${e.message}`), {
            stdoutPreview: out.slice(-1200),
            stderrPreview: err.slice(-1200),
          })
        );
      }
    });
  });
}

export type AnalyzeOutcome = {
  updated: {
    id: string;
    durationSec: number | null;
    loudnessLufs: number | null;
    loudnessRangeLu: number | null;
    lraLowLufs: number | null;
    lraHighLufs: number | null;
    truePeakDbfs: number | null;
    sampleRateHz: number | null;
    channels: number | null;
    bitrateKbps: number | null;
    analysisAt: Date;
  };
  warnings: string[];
  debug?: any;
};

export async function analyzeTrackById(trackId: string): Promise<AnalyzeOutcome> {
  const warnings: string[] = [];

  const track = await db.track.findUnique({ where: { id: trackId } });
  if (!track) throw new Error("Track not found");

  const audioUrl =
    track.audioUrl ??
    (track.assetKey
      ? `${process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "")}/${track.assetKey}`
      : null);

  if (!audioUrl) throw new Error("Track has no audioUrl nor assetKey to build a public URL");

  let tmpFile: string | null = null;
  let ffprobeDebug: any = null;
  let ebuDebug: any = null;

  try {
    // 0) Descargar
    tmpFile = await downloadToTemp(audioUrl);

    // 1) ffprobe
    let durationSec: number | null = null;
    let sampleRateHz: number | null = null;
    let channels: number | null = null;
    let bitrateKbps: number | null = null;

    try {
      const meta = await runFfprobeJson(tmpFile);
      ffprobeDebug = { code: 0, stdoutPreview: meta.raw?.slice(0, 600) ?? "", stderrPreview: "" };
      durationSec = meta.durationSec;
      sampleRateHz = meta.sampleRateHz;
      channels = meta.channels;
      bitrateKbps = meta.bitrateKbps;
    } catch (e: any) {
      warnings.push("ffprobe failed");
      ffprobeDebug = {
        error: e.message,
        ffprobePath: e.ffprobePath,
        stdoutPreview: e.stdoutPreview,
        stderrPreview: e.stderrPreview,
      };
    }

    // 2) ebur128
    let loudnessLufs: number | null = null;
    let loudnessRangeLu: number | null = null;
    let lraLowLufs: number | null = null;
    let lraHighLufs: number | null = null;
    let truePeakDbfs: number | null = null;

    try {
      const ebu = await measureEbuLoudnessFromLocalPath(tmpFile);
      loudnessLufs = ebu.integratedLufs;
      loudnessRangeLu = ebu.loudnessRangeLu;
      lraLowLufs = ebu.lraLowLufs;
      lraHighLufs = ebu.lraHighLufs;
      truePeakDbfs = ebu.truePeakDbfs;
      ebuDebug = { summaryPreview: ebu.rawSummary.slice(0, 800), ffmpegPath: resolveFfmpegPath() };
      if (loudnessLufs == null) warnings.push("lufs failed");
    } catch (e: any) {
      warnings.push("lufs failed");
      ebuDebug = { error: e.message, ffmpegPath: resolveFfmpegPath() };
    }

    // 3) Persistir
    const updated = await db.track.update({
      where: { id: trackId },
      data: {
        durationSec: durationSec ?? null,
        sampleRateHz: sampleRateHz ?? null,
        channels: channels ?? null,
        bitrateKbps: bitrateKbps ?? null,
        loudnessLufs,
        loudnessRangeLu,
        lraLowLufs,
        lraHighLufs,
        truePeakDbfs,
        analysisAt: new Date(),
      },
      select: {
        id: true,
        durationSec: true,
        loudnessLufs: true,
        loudnessRangeLu: true,
        lraLowLufs: true,
        lraHighLufs: true,
        truePeakDbfs: true,
        sampleRateHz: true,
        channels: true,
        bitrateKbps: true,
        analysisAt: true,
      },
    });

    const debug =
      process.env.NODE_ENV !== "production"
        ? {
            ffprobePath: resolveFfprobePath(),
            ffmpegPath: resolveFfmpegPath(),
            audioUrl,
            tmpFile,
            ffprobe: ffprobeDebug,
            ebur128: ebuDebug,
          }
        : undefined;

    return { updated, warnings, debug };
  } finally {
    if (tmpFile) {
      try {
        await fsp.unlink(tmpFile);
      } catch {
        // ignore
      }
    }
  }
}
