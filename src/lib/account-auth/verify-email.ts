import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const EMAIL_VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function isVerifyTokenStorageError(error: unknown) {
  const code = typeof error === "object" && error ? (error as { code?: string }).code : "";
  if (code === "P2021" || code === "P2022") return true;
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : "";
  return /EmailVerificationToken/i.test(message);
}

export async function createEmailVerificationTokenForUser(input: {
  userId: string;
  requestedIp?: string | null;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        status: true,
        emailVerifiedAt: true,
      },
    });
    if (!user || user.status !== "ACTIVE") return null;
    if (user.emailVerifiedAt) return null;

    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        requestedIp: input.requestedIp ?? null,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      rawToken,
      expiresAt,
    };
  } catch (error) {
    if (isVerifyTokenStorageError(error)) {
      console.error("[auth:verify-email] token_store_unavailable", {
        action: "create",
        code: typeof error === "object" && error ? (error as { code?: string }).code ?? null : null,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
    throw error;
  }
}

export async function findValidEmailVerificationToken(rawToken: string) {
  const tokenHash = hashToken(rawToken.trim());
  if (!tokenHash) return null;

  try {
    return prisma.emailVerificationToken.findFirst({
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
            status: true,
            emailVerifiedAt: true,
          },
        },
      },
    });
  } catch (error) {
    if (isVerifyTokenStorageError(error)) {
      console.error("[auth:verify-email] token_store_unavailable", {
        action: "find",
        code: typeof error === "object" && error ? (error as { code?: string }).code ?? null : null,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
    throw error;
  }
}

export async function consumeEmailVerificationToken(tokenId: string) {
  try {
    await prisma.emailVerificationToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
    return true;
  } catch (error) {
    if (isVerifyTokenStorageError(error)) {
      console.error("[auth:verify-email] token_store_unavailable", {
        action: "consume",
        code: typeof error === "object" && error ? (error as { code?: string }).code ?? null : null,
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
    throw error;
  }
}
