import "server-only";
import { ENV } from "@/lib/env";
import { BrevoEmailProvider } from "@/lib/account-auth/email/providers/brevo";
import { ConsoleEmailProvider } from "@/lib/account-auth/email/providers/console";
import type { AuthEmailPayload, EmailProvider, EmailSendResult } from "@/lib/account-auth/email/types";

function normalizeProviderName(raw: string | undefined) {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "brevo") return "brevo";
  return "console";
}

export function getAuthEmailProviderName() {
  return normalizeProviderName(ENV.AUTH_EMAIL_PROVIDER());
}

export function shouldExposeEmailDebugLinks() {
  return ENV.AUTH_EMAIL_DEBUG_LINKS() || process.env.NODE_ENV !== "production";
}

function getProvider(): EmailProvider {
  const providerName = getAuthEmailProviderName();
  if (providerName === "brevo") {
    const brevo = BrevoEmailProvider.fromEnv();
    if (brevo) return brevo;
    console.warn("[auth:email] provider=brevo requested but missing config, fallback=console");
  }
  return new ConsoleEmailProvider();
}

export async function sendAuthEmail(payload: AuthEmailPayload): Promise<EmailSendResult> {
  const provider = getProvider();
  try {
    return await provider.send(payload);
  } catch (error) {
    console.error("[auth:email] provider_error", {
      provider: provider.id,
      kind: payload.kind,
      to: payload.to,
      message: error instanceof Error ? error.message : String(error),
    });
    // fallback defensivo a consola en entornos no productivos
    if (provider.id !== "console" && process.env.NODE_ENV !== "production") {
      return new ConsoleEmailProvider().send(payload);
    }
    throw error;
  }
}

