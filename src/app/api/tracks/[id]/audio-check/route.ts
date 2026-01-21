// src/app/api/tracks/[id]/audio-check/route.ts
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAudioCheckStatus } from "@/lib/audio/audio-check";

export const dynamic = "force-dynamic";

type AudioCheckParams = {
  id: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<AudioCheckParams> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta id en la ruta" }, { status: 400 });
  }

  const track = await db.track.findUnique({
    where: { id },
    select: { audioUrl: true },
  });

  if (!track?.audioUrl) {
    return NextResponse.json({ ok: false, error: "Audio URL vacío" }, { status: 400 });
  }

  const audioCheck = await getAudioCheckStatus(track.audioUrl, {
    cacheKey: id,
  });

  if (audioCheck.status === "ok") {
    return NextResponse.json({
      ok: true,
      audioUrl: track.audioUrl,
      resolvedAudioUrl: audioCheck.resolvedAudioUrl,
    });
  }

  return NextResponse.json(
    { ok: false, error: audioCheck.message ?? "Audio URL no accesible" },
    { status: 400 },
  );
}
