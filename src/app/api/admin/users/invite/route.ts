import { NextRequest, NextResponse } from "next/server";
import { createInvite, normalizeBaseUrl } from "@/lib/account-auth/invite";
import { getAuthEmailProviderName, shouldExposeEmailDebugLinks } from "@/lib/account-auth/email";
import { sendInviteEmail } from "@/lib/account-auth/email/service";
import { requireRouteAdmin } from "@/lib/account-auth/route-guards";

export async function POST(req: NextRequest) {
  const user = await requireRouteAdmin();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    role?: "ADMIN" | "STAFF" | "CREATOR";
    expiresDays?: number;
  };

  const role = body.role === "ADMIN" || body.role === "STAFF" || body.role === "CREATOR" ? body.role : "CREATOR";
  let invite;
  try {
    invite = await createInvite({
      email: body.email ?? "",
      role,
      expiresDays: body.expiresDays,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid invite data" },
      { status: 400 },
    );
  }

  const baseUrl = normalizeBaseUrl(
    process.env.APP_BASE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`,
  );
  const registerUrl = `${baseUrl}/auth/register?token=${invite.token}`;
  await sendInviteEmail({
    to: invite.email,
    registerUrl,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });
  const exposeLink =
    shouldExposeEmailDebugLinks() && getAuthEmailProviderName() === "console";

  return NextResponse.json({
    ok: true,
    invite: {
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      ...(exposeLink
        ? {
            token: invite.token,
            registerUrl,
          }
        : {}),
    },
  });
}
