import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { APP_SESSION_COOKIE, getSessionUserFromCookie } from "@/lib/account-auth/session";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const c = await cookies();
  const rawSession = c.get(APP_SESSION_COOKIE)?.value;
  const user = await getSessionUserFromCookie(rawSession);
  if (!user || user.role !== "CREATOR") {
    return NextResponse.redirect(new URL("/auth/login?next=/creator/tracks", req.url), { status: 303 });
  }

  const { id } = await context.params;
  const formData = await req.formData();
  const title = (formData.get("title")?.toString() ?? "").trim();
  const artist = (formData.get("artist")?.toString() ?? "").trim();

  if (!title || !artist) {
    return NextResponse.redirect(new URL(`/creator/tracks/${id}?err=missing`, req.url), { status: 303 });
  }

  const updated = await prisma.track.updateMany({
    where: {
      id,
      ownerUserId: user.id,
    },
    data: {
      title,
      artist,
    },
  });

  if (!updated.count) {
    return NextResponse.redirect(new URL("/creator/tracks?err=forbidden", req.url), { status: 303 });
  }

  return NextResponse.redirect(new URL(`/creator/tracks/${id}?ok=1`, req.url), { status: 303 });
}

