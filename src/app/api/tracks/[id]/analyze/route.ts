import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";

export const dynamic = "force-dynamic";

/* -------------------- Utils -------------------- */
function bins() {
  const ffmpeg = (process.env.FFMPEG_PATH ?? "").trim() || "ffmpeg";
  const ffprobe = (process.env.FFPROBE_PATH ?? "").trim() || "ffprobe";
  return { ffmpeg, ffprobe };
}
async function check(bin: string) {
  try { await execa(bin, ["-version"]); return true; } catch { return false; }
}
function toNumber(s: any): number | null {
  if (s == null) return null;
  const v = Number(String(s).replace(",", ".").trim());
  return Number.isFinite(v) ? v : null;
}

/* -------------------- Descarga temp -------------------- */
async function download(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No pude descargar audio: ${r.status} ${r.statusText}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const p = join(tmpdir(), `lynx-audio-${Date.now()}.tmp`);
  await fs.writeFile(p, buf);
  return p;
}

/* -------------------- ffprobe (json) -------------------- */
async function probeJson(ffprobePath: string, input: string) {
  const { stdout } = await execa(ffprobePath, [
    "-v","error",
    "-print_format","json",
    "-show_format","-show_streams",
    input
  ]);
  return JSON.parse(stdout);
}

/* -------------------- ebur128 (texto) -------------------- */
async function parseWithEbur128(ffmpegPath: string, input: string) {
  const { stderr } = await execa(ffmpegPath, [
    "-hide_banner","-nostats",
    "-vn","-sn","-dn",
    "-i", input,
    "-filter_complex","ebur128=peak=true:framelog=verbose",
    "-f","null","-"
  ]);

  const mI  = stderr.match(/\bI:\s*(-?\d+[.,]?\d*)\s*LUFS\b/i) ||
              stderr.match(/Integrated loudness:\s*(-?\d+[.,]?\d*)\s*LUFS/i);
  const mLR = stderr.match(/\bLRA:\s*(-?\d+[.,]?\d*)\s*LU\b/i) ||
              stderr.match(/Loudness range:\s*(-?\d+[.,]?\d*)\s*LU/i);
  const mTP = stderr.match(/True peak:\s*(-?\d+[.,]?\d*)\s*dBFS/i) ||
              stderr.match(/\bTP:\s*(-?\d+[.,]?\d*)\s*dBFS/i);

  return {
    loudnessLufs: toNumber(mI?.[1]),
    loudnessRangeLu: toNumber(mLR?.[1]),
    truePeakDbfs: toNumber(mTP?.[1]),
    raw: process.env.DEBUG_AUDIO ? stderr : undefined,
  };
}

/* -------------------- loudnorm (JSON) -------------------- */
/** Soporta dos “dialectos”:
 *  - medido:  measured_I / measured_TP / measured_LRA
 *  - el que muestra tu build: input_i / input_tp / input_lra
 *  El JSON suele salir por STDERR.
 */
async function parseWithLoudnorm(ffmpegPath: string, input: string) {
  let out: string | undefined;
  let err: string | undefined;

  try {
    const run = await execa(ffmpegPath, [
      "-hide_banner","-nostats",
      "-vn","-sn","-dn",
      "-i", input,
      "-af","loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
      "-f","null","-"
    ]);
    out = run.stdout;
    err = run.stderr;
  } catch (e: any) {
    out = e?.stdout;
    err = e?.stderr;
  }

  const text = (err && err.trim().length > 0) ? err.trim() : (out ?? "").trim();
  if (!text) return { loudnessLufs: null, loudnessRangeLu: null, truePeakDbfs: null, raw: undefined };

  const block = text.match(/\{[\s\S]*\}/);
  const jsonTxt = block ? block[0] : text;

  let j: any;
  try { j = JSON.parse(jsonTxt); }
  catch { return { loudnessLufs: null, loudnessRangeLu: null, truePeakDbfs: null, raw: text }; }

  // 1) Intento measured_*
  let I   = toNumber(j?.measured_I);
  let LRA = toNumber(j?.measured_LRA);
  let TP  = toNumber(j?.measured_TP);

  // 2) Fallback a input_* (tu caso)
  if (I == null && j?.input_i != null)  I = toNumber(j.input_i);
  if (LRA == null && j?.input_lra != null) LRA = toNumber(j.input_lra);
  if (TP == null && j?.input_tp != null)  TP = toNumber(j.input_tp);

  return { loudnessLufs: I, loudnessRangeLu: LRA, truePeakDbfs: TP, raw: process.env.DEBUG_AUDIO ? text : undefined };
}

/* -------------------- Waveform (0..1) -------------------- */
async function buildWaveform(ffmpegPath: string, input: string, buckets = 256) {
  const rawPath = join(tmpdir(), `lynx-${Date.now()}.s16le`);
  await execa(ffmpegPath, ["-y","-vn","-sn","-dn","-i", input, "-ac","1","-ar","8000","-f","s16le", rawPath]);
  const buf = await fs.readFile(rawPath).catch(() => Buffer.alloc(0));
  try { await fs.unlink(rawPath); } catch {}
  const total = Math.floor(buf.length / 2);
  if (total <= 0) return [];
  const step = Math.max(1, Math.floor(total / buckets));
  let maxAbs = 0;
  const vals: number[] = [];
  for (let i = 0; i < total; i += step) {
    const s = buf.readInt16LE(i * 2);
    const a = Math.abs(s);
    maxAbs = a > maxAbs ? a : maxAbs;
    vals.push(a);
  }
  if (maxAbs < 1) maxAbs = 1;
  return vals.map(v => +(v / maxAbs).toFixed(5));
}

/* -------- Guardado robusto de waveform (Bytes/base64/Text) -------- */
async function saveTech(opts: {
  id: string;
  durationSec: number | null;
  sampleRateHz: number | null;
  channels: number | null;
  bitrateKbps: number | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
  wf: number[];
}) {
  const { id, durationSec, sampleRateHz, channels, bitrateKbps, loudnessLufs, loudnessRangeLu, truePeakDbfs, wf } = opts;
  const json = JSON.stringify(wf);

  // 1) Bytes
  try {
    await prisma.track.update({
      where: { id },
      data: {
        durationSec, sampleRateHz, channels, bitrateKbps,
        loudnessLufs, loudnessRangeLu, truePeakDbfs,
        waveform: Buffer.from(json, "utf8"),
        analysisAt: new Date(), updatedAt: new Date(),
      },
    });
    return;
  } catch (e: any) {
    const m = String(e?.message ?? e);
    if (!/Bytes|base64|PrismaValue::Bytes/i.test(m)) throw e;
  }

  // 2) base64
  try {
    const b64 = Buffer.from(json, "utf8").toString("base64");
    // @ts-expect-error: algunos drivers aceptan base64 para Bytes
    await prisma.track.update({
      where: { id },
      data: {
        durationSec, sampleRateHz, channels, bitrateKbps,
        loudnessLufs, loudnessRangeLu, truePeakDbfs,
        waveform: b64,
        analysisAt: new Date(), updatedAt: new Date(),
      },
    });
    return;
  } catch {}

  // 3) Texto (si schema lo permite)
  await prisma.track.update({
    where: { id },
    data: {
      durationSec, sampleRateHz, channels, bitrateKbps,
      loudnessLufs, loudnessRangeLu, truePeakDbfs,
      waveform: json,
      analysisAt: new Date(), updatedAt: new Date(),
    },
  });
}

/* -------------------- Handler -------------------- */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await ctx.params;
  const url = new URL(req.url);
  const urlId = url.pathname.split("/")[3]; // /api/tracks/:id/analyze
  const id = routeId || urlId;
  if (!id) {
    const payload = { ok: false, error: "Falta id en la ruta" };
    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload, { status: 400 });
  }

  const wantNormalize = url.searchParams.get("normalize") === "1";
  const { ffmpeg, ffprobe } = bins();
  const okF = await check(ffmpeg);
  const okP = await check(ffprobe);
  if (!okF || !okP) {
    const payload = {
      ok: false,
      error: "Binarios no disponibles",
      detail: { env: { FFMPEG_PATH: process.env.FFMPEG_PATH, FFPROBE_PATH: process.env.FFPROBE_PATH }, resolved: { ffmpeg, ffprobe } },
    };
    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload, { status: 500 });
  }

  const t = await prisma.track.findUnique({ where: { id }, select: { id: true, audioUrl: true } });
  if (!t?.audioUrl) {
    const payload = { ok: false, error: "Track sin audioUrl" };
    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload, { status: 400 });
  }

  const input = await download(t.audioUrl);
  let appliedNormalize = false;

  try {
    // ---- Probe técnico
    const pj = await probeJson(ffprobe, input);
    const stream = Array.isArray(pj.streams) ? pj.streams.find((s: any) => s.codec_type === "audio") : null;

    const durationSec =
      stream?.duration ? Math.round(parseFloat(String(stream.duration).replace(",", "."))) :
      pj?.format?.duration ? Math.round(parseFloat(String(pj.format.duration).replace(",", "."))) :
      null;

    const sampleRateHz = stream?.sample_rate ? parseInt(`${stream.sample_rate}`, 10) : null;
    const channels     = stream?.channels ?? null;

    const bitrateKbps =
      stream?.bit_rate ? Math.round(parseInt(`${stream.bit_rate}`, 10) / 1000) :
      pj?.format?.bit_rate ? Math.round(parseInt(`${pj.format.bit_rate}`, 10) / 1000) :
      null;

    // ---- Loudness/TP: ebur128 → fallback loudnorm
    let { loudnessLufs, loudnessRangeLu, truePeakDbfs } = await parseWithEbur128(ffmpeg, input);

    if (loudnessLufs == null || truePeakDbfs == null) {
      const alt = await parseWithLoudnorm(ffmpeg, input);
      if (alt.loudnessLufs != null)    loudnessLufs    = alt.loudnessLufs;
      if (alt.loudnessRangeLu != null) loudnessRangeLu = alt.loudnessRangeLu;
      if (alt.truePeakDbfs != null)    truePeakDbfs    = alt.truePeakDbfs;
    }

    // Evita falsos -70
    if (loudnessLufs !== null && loudnessLufs < -60) loudnessLufs = null;

    // ---- Waveform
    const wf = await buildWaveform(ffmpeg, input, 256);

    // ---- Normalización (sólo si hay LUFS medido)
    if (wantNormalize && typeof loudnessLufs === "number") {
      const target = -16;
      const gain = +(target - loudnessLufs).toFixed(2);
      const outTmp = join(tmpdir(), `lynx-norm-${Date.now()}.wav`);
      await execa(ffmpeg, ["-y","-vn","-sn","-dn","-i", input, "-af", `volume=${gain}dB`, outTmp]);
      try { await fs.unlink(outTmp); } catch {}
      appliedNormalize = true;
    }

    // ---- Guardar en DB
    await saveTech({
      id,
      durationSec,
      sampleRateHz,
      channels,
      bitrateKbps,
      loudnessLufs,
      loudnessRangeLu,
      truePeakDbfs,
      wf,
    });

    const payload = {
      ok: true,
      bins: { ffmpeg, ffprobe },
      analyzed: {
        durationSec, sampleRateHz, channels, bitrateKbps,
        loudnessLufs, loudnessRangeLu, truePeakDbfs
      },
      normalized: appliedNormalize,
    };
    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload);
  } catch (e: any) {
    const payload = {
      ok: false,
      error: e?.shortMessage ?? e?.message ?? "Analyze error",
      extra: process.env.DEBUG_AUDIO ? { stack: e?.stack } : undefined,
    };
    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload, { status: 500 });
  } finally {
    try { await fs.unlink(input); } catch {}
  }
}
