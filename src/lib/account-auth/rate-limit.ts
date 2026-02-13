import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

type ConsumeRateLimitInput = {
  action: "login" | "register" | "forgot" | "reset" | "change_password";
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

export async function consumeRateLimit(input: ConsumeRateLimitInput) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - input.windowMs);
  const key = buildKey(input.action, input.fingerprint);

  const current = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!current) {
    await prisma.authRateLimit.create({
      data: {
        key,
        action: input.action,
        windowStart: now,
        count: 1,
      },
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.blockedUntil && current.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((current.blockedUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  const inSameWindow = current.windowStart > windowStart;
  const nextCount = inSameWindow ? current.count + 1 : 1;

  if (nextCount > input.maxAttempts) {
    const blockedUntil = new Date(now.getTime() + input.blockMs);
    await prisma.authRateLimit.update({
      where: { key },
      data: {
        count: nextCount,
        blockedUntil,
        windowStart: inSameWindow ? current.windowStart : now,
      },
    });
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(input.blockMs / 1000)),
    };
  }

  await prisma.authRateLimit.update({
    where: { key },
    data: {
      count: nextCount,
      blockedUntil: null,
      windowStart: inSameWindow ? current.windowStart : now,
    },
  });

  return { allowed: true, retryAfterSec: 0 };
}
