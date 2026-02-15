import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import {
  APP_SESSION_COOKIE,
  clearViewAsRoleCookie,
  getSessionUserFromCookie,
  setViewAsRoleCookie,
} from "@/lib/account-auth/session";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

function resolveRole(raw: string): UserRole | null {
  const role = raw.trim().toUpperCase();
  if (role === "ADMIN" || role === "STAFF" || role === "CREATOR") {
    return role;
  }
  return null;
}

function destinationByRole(role: UserRole) {
  if (role === "CREATOR") return "/creator";
  return "/admin";
}

export async function POST(req: NextRequest) {
  const rawSession = req.cookies.get(APP_SESSION_COOKIE)?.value;
  const currentUser = await getSessionUserFromCookie(rawSession);
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=unauthorized"), { status: 303 });
  }

  const formData = await req.formData();
  const requestedRole = resolveRole(formData.get("role")?.toString() ?? "");
  if (!requestedRole) {
    return NextResponse.redirect(redirectUrl(req, "/admin?err=view_as_invalid"), { status: 303 });
  }

  if (requestedRole === "ADMIN") {
    await clearViewAsRoleCookie();
  } else {
    await setViewAsRoleCookie(requestedRole);
  }

  return NextResponse.redirect(redirectUrl(req, destinationByRole(requestedRole)), { status: 303 });
}
