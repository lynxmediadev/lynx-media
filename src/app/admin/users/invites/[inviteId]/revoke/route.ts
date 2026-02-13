import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAdmin, safeRouteRedirect } from "@/lib/account-auth/route-guards";

type RouteContext = {
  params: Promise<{ inviteId: string }>;
};

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/admin/users")) return "/admin/users";
  return value;
}

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const admin = await requireRouteAdmin();
  if (!admin) {
    return NextResponse.redirect(safeRouteRedirect(req, "/admin/login?err=1"), { status: 303 });
  }

  const { inviteId } = await context.params;
  const formData = await req.formData();
  const returnTo = safeReturnTo((formData.get("returnTo")?.toString() ?? "").trim());

  await prisma.inviteToken.deleteMany({
    where: { id: inviteId },
  });

  return NextResponse.redirect(
    safeRouteRedirect(req, withQuery(returnTo, "ok", "invite_revoked")),
    { status: 303 },
  );
}

