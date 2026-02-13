import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/account-auth/password";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import {
  APP_SESSION_COOKIE,
  createUserSession,
  getSessionUserFromCookie,
  revokeAllUserSessions,
} from "@/lib/account-auth/session";
import { prisma } from "@/lib/prisma";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

function accountPathByRole(role: "ADMIN" | "STAFF" | "CREATOR") {
  if (role === "CREATOR") return "/creator/tracks";
  return "/admin/account";
}

function fingerprintFromRequest(req: NextRequest, userId: string) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown-ip";
  const ua = req.headers.get("user-agent") ?? "unknown-ua";
  return `${ip}|${ua}|${userId}`;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(APP_SESSION_COOKIE)?.value;
  const sessionUser = await getSessionUserFromCookie(rawSession);

  if (!sessionUser) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=unauthorized"), { status: 303 });
  }

  const throttle = await consumeRateLimit({
    action: "change_password",
    fingerprint: fingerprintFromRequest(req, sessionUser.id),
    maxAttempts: 6,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });
  if (!throttle.allowed) {
    return NextResponse.redirect(
      redirectUrl(req, `${accountPathByRole(sessionUser.role)}?err=rate_limited`),
      { status: 303 },
    );
  }

  const formData = await req.formData();
  const currentPassword = (formData.get("currentPassword")?.toString() ?? "").trim();
  const newPassword = (formData.get("newPassword")?.toString() ?? "").trim();
  const confirmPassword = (formData.get("confirmPassword")?.toString() ?? "").trim();

  const redirectBase = accountPathByRole(sessionUser.role);
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.redirect(redirectUrl(req, `${redirectBase}?err=missing`), { status: 303 });
  }
  if (newPassword.length < 8) {
    return NextResponse.redirect(redirectUrl(req, `${redirectBase}?err=password`), { status: 303 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.redirect(redirectUrl(req, `${redirectBase}?err=mismatch`), { status: 303 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=unauthorized"), { status: 303 });
  }

  const currentOk = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentOk) {
    return NextResponse.redirect(redirectUrl(req, `${redirectBase}?err=invalid_current`), {
      status: 303,
    });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
    select: { id: true },
  });

  await revokeAllUserSessions(user.id);

  await createUserSession({
    userId: user.id,
    role: user.role,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.redirect(redirectUrl(req, `${redirectBase}?ok=password_changed`), {
    status: 303,
  });
}

