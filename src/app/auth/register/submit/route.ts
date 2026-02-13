import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/account-auth/password";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { createUserSession } from "@/lib/account-auth/session";
import { prisma } from "@/lib/prisma";

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function parseInviteToken(raw: string) {
  return raw.trim();
}

function registerErrorUrl(baseUrl: string, err: string, token: string) {
  const url = new URL(`/auth/register?err=${encodeURIComponent(err)}`, baseUrl);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  if (token) url.searchParams.set("token", token);
  return url;
}

function fingerprintFromRequest(req: NextRequest, email: string) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown-ip";
  const ua = req.headers.get("user-agent") ?? "unknown-ua";
  return `${ip}|${ua}|${email.trim().toLowerCase()}`;
}

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = (formData.get("name")?.toString() ?? "").trim();
  const emailInput = (formData.get("email")?.toString() ?? "").trim().toLowerCase();
  const password = (formData.get("password")?.toString() ?? "").trim();
  const inviteTokenRaw = parseInviteToken(formData.get("token")?.toString() ?? "");

  if (!name || !password || !inviteTokenRaw) {
    return NextResponse.redirect(registerErrorUrl(req.url, "missing", inviteTokenRaw), { status: 303 });
  }

  const throttle = await consumeRateLimit({
    action: "register",
    fingerprint: fingerprintFromRequest(req, emailInput || "unknown"),
    maxAttempts: 6,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });
  if (!throttle.allowed) {
    return NextResponse.redirect(registerErrorUrl(req.url, "rate_limited", inviteTokenRaw), { status: 303 });
  }

  if (password.length < 8) {
    return NextResponse.redirect(registerErrorUrl(req.url, "password", inviteTokenRaw), { status: 303 });
  }

  const invite = await prisma.inviteToken.findFirst({
    where: {
      tokenHash: hashToken(inviteTokenRaw),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      userId: true,
    },
  });

  if (!invite) {
    return NextResponse.redirect(registerErrorUrl(req.url, "invite", inviteTokenRaw), { status: 303 });
  }
  const inviteEmail = invite.email.toLowerCase();
  const email = emailInput || inviteEmail;
  if (email !== inviteEmail) {
    return NextResponse.redirect(registerErrorUrl(req.url, "email", inviteTokenRaw), { status: 303 });
  }

  const invitedUser = await prisma.user.findUnique({
    where: { id: invite.userId },
    select: { id: true, email: true, status: true, role: true },
  });

  if (!invitedUser || invitedUser.email.toLowerCase() !== inviteEmail) {
    return NextResponse.redirect(registerErrorUrl(req.url, "invite", inviteTokenRaw), { status: 303 });
  }

  if (invitedUser.status !== "INVITED") {
    return NextResponse.redirect(registerErrorUrl(req.url, "exists", inviteTokenRaw), { status: 303 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.update({
    where: { id: invitedUser.id },
    data: {
      name,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
    select: { id: true, role: true },
  });

  await prisma.inviteToken.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  await createUserSession({
    userId: user.id,
    role: user.role,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.redirect(redirectUrl(req, "/creator/tracks"), { status: 303 });
}
