import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 30; // 30 minutos

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createPasswordResetToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") return null;

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    userId: user.id,
    email: user.email,
    rawToken,
    expiresAt,
  };
}

export async function findValidPasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken.trim());
  if (!tokenHash) return null;

  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });
}

export async function consumePasswordResetToken(tokenId: string) {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

