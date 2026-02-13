import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const APP_SESSION_COOKIE = "app_session";
const APP_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "high" as const,
  };
}

type SessionPayload = {
  sub: string;
  role: UserRole;
  sid: string;
  st: string;
  iat: number;
  exp: number;
};

function toBase64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

function getAuthSessionSecret() {
  const authSecret = (process.env.AUTH_SESSION_SECRET ?? "").trim();
  const legacySecret = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  const secret = authSecret || legacySecret;
  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET (or ADMIN_SESSION_SECRET fallback)");
  }
  return secret;
}

function signPayload(payloadB64: string, secret: string) {
  return toBase64Url(crypto.createHmac("sha256", secret).update(payloadB64).digest());
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signSessionCookie(payload: SessionPayload) {
  const secret = getAuthSessionSecret();
  const payloadB64 = toBase64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sigB64 = signPayload(payloadB64, secret);
  return `v2.${payloadB64}.${sigB64}`;
}

export function verifySessionCookie(raw: string) {
  try {
    const [version, payloadB64, sigB64] = raw.split(".");
    if (version !== "v2" || !payloadB64 || !sigB64) return null;

    const expectedSig = signPayload(payloadB64, getAuthSessionSecret());
    if (expectedSig.length !== sigB64.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sigB64))) return null;

    const payload = JSON.parse(fromBase64Url(payloadB64).toString("utf8")) as SessionPayload;
    if (!payload?.sub || !payload?.sid || !payload?.st || !payload?.role) return null;
    if (typeof payload.exp !== "number" || Date.now() >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(rawToken: string, expiresAt: Date) {
  const c = await cookies();
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  c.set(APP_SESSION_COOKIE, rawToken, {
    ...baseCookieOptions(),
    expires: expiresAt,
    maxAge,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.set(APP_SESSION_COOKIE, "", {
    ...baseCookieOptions(),
    maxAge: 0,
  });
}

export async function revokeAllUserSessions(userId: string) {
  if (!userId) return;
  await prisma.userSession.deleteMany({ where: { userId } });
}

export async function createUserSession(params: {
  userId: string;
  role: UserRole;
  ip?: string;
  userAgent?: string;
}) {
  const issuedAt = Date.now();
  const expiresAt = new Date(issuedAt + APP_SESSION_TTL_MS);
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const sessionTokenHash = hashSessionToken(sessionToken);

  const session = await prisma.userSession.create({
    data: {
      userId: params.userId,
      sessionTokenHash,
      expiresAt,
      ip: params.ip,
      userAgent: params.userAgent,
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  const cookieToken = signSessionCookie({
    sub: params.userId,
    role: params.role,
    sid: session.id,
    st: sessionToken,
    iat: issuedAt,
    exp: session.expiresAt.getTime(),
  });

  await setSessionCookie(cookieToken, session.expiresAt);

  await prisma.user.update({
    where: { id: params.userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function destroyUserSessionByCookie(rawCookie: string | undefined) {
  if (!rawCookie) return;
  const payload = verifySessionCookie(rawCookie);
  if (!payload) return;

  await prisma.userSession.deleteMany({
    where: {
      id: payload.sid,
      userId: payload.sub,
      sessionTokenHash: hashSessionToken(payload.st),
    },
  });
}

export async function getSessionUserFromCookie(rawCookie: string | undefined) {
  if (!rawCookie) return null;
  const payload = verifySessionCookie(rawCookie);
  if (!payload) return null;

  const session = await prisma.userSession.findFirst({
    where: {
      id: payload.sid,
      userId: payload.sub,
      sessionTokenHash: hashSessionToken(payload.st),
      expiresAt: { gt: new Date() },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!session?.user || session.user.status !== "ACTIVE") return null;
  return session.user;
}
