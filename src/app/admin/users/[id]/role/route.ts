import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRouteAdmin, safeRouteRedirect } from "@/lib/account-auth/route-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/admin/users")) return "/admin/users";
  return value;
}

function parseRole(value: string): UserRole | null {
  const role = value.trim().toUpperCase();
  if (
    role === "ADMIN" ||
    role === "STAFF" ||
    role === "CREATOR" ||
    role === "CLIENT"
  ) {
    return role;
  }
  return null;
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
  const targetRole = parseRole((formData.get("role")?.toString() ?? "").trim());

  if (!targetRole) {
    return NextResponse.redirect(
      safeRouteRedirect(req, withQuery(returnTo, "err", "invalid_role")),
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

  const removingAdminRole = targetUser.role === "ADMIN" && targetRole !== "ADMIN";
  if (removingAdminRole && targetUser.status === "ACTIVE") {
    const activeAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    if (activeAdmins <= 1) {
      return NextResponse.redirect(
        safeRouteRedirect(req, withQuery(returnTo, "err", "last_admin_protected")),
        { status: 303 },
      );
    }
  }

  await prisma.user.update({
    where: { id },
    data: { role: targetRole },
  });

  return NextResponse.redirect(
    safeRouteRedirect(req, withQuery(returnTo, "ok", "user_updated")),
    { status: 303 },
  );
}
