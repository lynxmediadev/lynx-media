import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/account-auth/password";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { createUserSession } from "@/lib/account-auth/session";
import { verifyTurnstile } from "@/lib/account-auth/turnstile";
import { ENV } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function getSafeRedirectByRole(role: "ADMIN" | "STAFF" | "CREATOR", requestedNext: string | null) {
  if (requestedNext && requestedNext.startsWith("/")) {
    if (role === "CREATOR" && requestedNext.startsWith("/creator")) return requestedNext;
    if ((role === "ADMIN" || role === "STAFF") && requestedNext.startsWith("/admin")) return requestedNext;
  }

  if (role === "CREATOR") return "/creator/tracks";
  return "/admin/tracks";
}

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

function fingerprintFromRequest(req: NextRequest, email: string) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown-ip";
  const ua = req.headers.get("user-agent") ?? "unknown-ua";
  return `${ip}|${ua}|${email.trim().toLowerCase()}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = (formData.get("email")?.toString() ?? "").trim().toLowerCase();
  const password = (formData.get("password")?.toString() ?? "").trim();
  const next = (formData.get("next")?.toString() ?? "").trim();
  const turnstileToken = (formData.get("cf-turnstile-response")?.toString() ?? "").trim();

  const captcha = await verifyTurnstile({
    token: turnstileToken,
    remoteIp: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "",
  });
  if (!captcha.ok) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=captcha"), { status: 303 });
  }

  const throttle = await consumeRateLimit({
    action: "login",
    fingerprint: fingerprintFromRequest(req, email || "unknown"),
    maxAttempts: 8,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });
  if (!throttle.allowed) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=rate_limited"), { status: 303 });
  }

  if (!email || !password) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=missing"), { status: 303 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=invalid"), { status: 303 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=invalid"), { status: 303 });
  }
  if (ENV.AUTH_ENFORCE_VERIFIED_EMAIL() && !user.emailVerifiedAt) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=unverified"), { status: 303 });
  }

  await createUserSession({
    userId: user.id,
    role: user.role,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const destination = getSafeRedirectByRole(user.role, next || null);
  return NextResponse.redirect(redirectUrl(req, destination), { status: 303 });
}
