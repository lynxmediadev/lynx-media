import "server-only";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ConsumeRateLimitInput = {
  action:
    | "login"
    | "register"
    | "forgot"
    | "reset"
    | "change_password"
    | "verify_email_send"
    | "support_ticket_submit";
  fingerprint: string;
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
};

function hashFingerprint(fingerprint: string) {
  return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

function buildKey(action: string, fingerprint: string) {
  return `${action}:${hashFingerprint(fingerprint)}`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function consumeRateLimit(input: ConsumeRateLimitInput) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - input.windowMs);
  const key = buildKey(input.action, input.fingerprint);

  let current = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!current) {
    try {
      await prisma.authRateLimit.create({
        data: {
          key,
          action: input.action,
          windowStart: now,
          count: 1,
        },
      });
      return { allowed: true, retryAfterSec: 0 };
    } catch (error) {
      // Condición de carrera esperable en ráfagas: otro request creó la fila primero.
      if (!isUniqueConstraintError(error)) throw error;
      current = await prisma.authRateLimit.findUnique({ where: { key } });
      if (!current) throw error;
    }
  }

  if (current.blockedUntil && current.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((current.blockedUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  const inSameWindow = current.windowStart > windowStart;
  if (!inSameWindow) {
    await prisma.authRateLimit.update({
      where: { key },
      data: {
        count: 1,
        blockedUntil: null,
        windowStart: now,
      },
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  const bumped = await prisma.authRateLimit.update({
    where: { key },
    data: {
      count: { increment: 1 },
    },
    select: { count: true },
  });
  const nextCount = bumped.count;

  if (nextCount > input.maxAttempts) {
    const blockedUntil = new Date(now.getTime() + input.blockMs);
    await prisma.authRateLimit.update({
      where: { key },
      data: {
        blockedUntil,
      },
    });
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(input.blockMs / 1000)),
    };
  }

  return { allowed: true, retryAfterSec: 0 };
}
