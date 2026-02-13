import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/account-auth/reset";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";

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

  const throttle = await consumeRateLimit({
    action: "forgot",
    fingerprint: fingerprintFromRequest(req, email || "unknown"),
    maxAttempts: 5,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });

  if (!throttle.allowed) {
    return NextResponse.redirect(redirectUrl(req, "/auth/forgot-password?err=rate_limited"), {
      status: 303,
    });
  }

  if (!email) {
    return NextResponse.redirect(redirectUrl(req, "/auth/forgot-password?ok=sent"), { status: 303 });
  }

  const reset = await createPasswordResetToken(email);
  if (!reset) {
    return NextResponse.redirect(redirectUrl(req, "/auth/forgot-password?ok=sent"), { status: 303 });
  }

  const baseUrl = new URL(req.url);
  if (baseUrl.hostname === "0.0.0.0") baseUrl.hostname = "localhost";
  const resetLink = `${baseUrl.origin}/auth/reset-password?token=${encodeURIComponent(reset.rawToken)}`;

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.redirect(
      redirectUrl(req, `/auth/forgot-password?ok=sent&debugLink=${encodeURIComponent(resetLink)}`),
      { status: 303 },
    );
  }

  // TODO(v2): enviar resetLink por proveedor de email.
  return NextResponse.redirect(redirectUrl(req, "/auth/forgot-password?ok=sent"), { status: 303 });
}

