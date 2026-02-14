import "server-only";
import { ENV } from "@/lib/env";

type VerifyTurnstileInput = {
  token: string;
  remoteIp?: string;
};

type TurnstileApiResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

export function isTurnstileEnabled() {
  return ENV.TURNSTILE_ENABLED() && Boolean(ENV.TURNSTILE_SECRET_KEY());
}

export async function verifyTurnstile(input: VerifyTurnstileInput) {
  if (!isTurnstileEnabled()) return { ok: true, skipped: true as const, code: "" };

  const token = input.token.trim();
  if (!token) return { ok: false, skipped: false as const, code: "captcha_required" };

  const secret = ENV.TURNSTILE_SECRET_KEY();
  if (!secret) return { ok: false, skipped: false as const, code: "captcha_unavailable" };

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (input.remoteIp?.trim()) {
    body.set("remoteip", input.remoteIp.trim());
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) {
      return { ok: false, skipped: false as const, code: `captcha_http_${response.status}` };
    }

    const json = (await response.json().catch(() => ({}))) as TurnstileApiResponse;
    if (json.success) return { ok: true, skipped: false as const, code: "" };

    const firstError = json["error-codes"]?.[0] ?? "captcha_failed";
    return { ok: false, skipped: false as const, code: firstError };
  } catch (error) {
    return {
      ok: false,
      skipped: false as const,
      code: error instanceof Error ? `captcha_exception_${error.name}` : "captcha_exception",
    };
  }
}

