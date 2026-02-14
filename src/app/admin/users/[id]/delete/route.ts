import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAdmin, safeRouteRedirect } from "@/lib/account-auth/route-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
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

  const { id } = await context.params;
  const formData = await req.formData();
  const returnTo = safeReturnTo((formData.get("returnTo")?.toString() ?? "").trim());

  if (id === admin.id) {
    return NextResponse.redirect(
      safeRouteRedirect(req, withQuery(returnTo, "err", "self_delete_blocked")),
      { status: 303 },
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, status: true },
  });
  if (!targetUser) {
    return NextResponse.redirect(
      safeRouteRedirect(req, withQuery(returnTo, "err", "user_not_found")),
      { status: 303 },
    );
  }

  const deletingLastAdmin =
    targetUser.role === "ADMIN" &&
    targetUser.status === "ACTIVE" &&
    (await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } })) <= 1;
  if (deletingLastAdmin) {
    return NextResponse.redirect(
      safeRouteRedirect(req, withQuery(returnTo, "err", "last_admin_protected")),
      { status: 303 },
    );
  }

  await prisma.user.delete({
    where: { id },
  });

  return NextResponse.redirect(
    safeRouteRedirect(req, withQuery(returnTo, "ok", "user_deleted")),
    { status: 303 },
  );
}
