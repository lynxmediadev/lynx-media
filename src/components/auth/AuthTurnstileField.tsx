"use client";

import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function AuthTurnstileField() {
  if (!SITE_KEY) return null;

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="dark" />
      <p className="text-[10px] text-muted-foreground">
        Protección anti-bot activa.
      </p>
    </div>
  );
}

