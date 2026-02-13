// src/app/api/tracks/[id]/audio-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAudioCheckStatus } from "@/lib/audio/audio-check";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";

export const dynamic = "force-dynamic";

type AudioCheckParams = {
  id: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<AudioCheckParams> },
) {
  const { id } = await params;
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await canAccessTrackByRole(user, id);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

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
