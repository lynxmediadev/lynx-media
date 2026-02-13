// src/app/api/licensing/request/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ POST /api/licensing/request — Crear solicitud pública                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Anti-bot: honeypot + tiempo mínimo + rate-limit (cookie).                 │
 * │ - CSRF: token self-contained (sin cookie), verificado aquí.                 │
 * │ - Next 15:                                                                   │
 * │     • cookies(): usar `const c = await cookies()`                            │
 * │     • headers: usar `req.headers` (Web Headers), no `headers()`              │
 * │ - Prisma: `restrictions` debe ser String[] (transformamos textarea → array) │
 * │ - Sync inmediato a Sheets (reason: "created", source: "public").            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers"; // Dynamic API (async)
import { Currency } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isHoneypotTripped, isTooFast, getClientIp } from "@/lib/antibot";
import { verifyCsrfToken } from "@/lib/csrf";
import { sendLicensingSync } from "@/lib/sync";

function clampText(s: string, max = 2000) {
  const t = (s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

// Convierte textarea a array de strings (split por salto de línea / coma / punto y coma)
function toStringArray(input: unknown, { maxItems = 50 }: { maxItems?: number } = {}): string[] {
  const raw = String(input ?? "").trim();
  if (!raw) return [];
  const arr = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  return arr.slice(0, maxItems);
}

export async function POST(req: NextRequest) {
  try {
    // a) Body
    const body = (await req.json()) as any;

    // b) Anti-bot
    if (isHoneypotTripped(body.website)) {
      return NextResponse.json({ ok: false, error: "Rejected" }, { status: 400 });
    }
    if (isTooFast(Number(body.startedAt) || 0, 5000)) {
      return NextResponse.json({ ok: false, error: "Too fast" }, { status: 400 });
    }

    // c) Rate-limit por cookie (30s) — Dynamic API (await cookies())
    const c = await cookies();
    const last = Number(c.get("lr_last")?.value || 0);
    if (last && Date.now() - last < 30_000) {
      return NextResponse.json({ ok: false, error: "Slow down" }, { status: 429 });
    }

    // d) CSRF (token self-contained)
    const csrfFromForm = String(body.csrf || "");
    if (!csrfFromForm || !verifyCsrfToken(csrfFromForm)) {
      return NextResponse.json({ ok: false, error: "CSRF" }, { status: 400 });
    }

    // e) Normalización/validación liviana
    const name = clampText(String(body.name || ""), 200);
    const email = clampText(String(body.email || ""), 200);
    if (!name || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
    }

    const company = clampText(String(body.company || ""), 200) || null;
    const projectType = clampText(String(body.projectType || ""), 120) || "Otro";
    const media = clampText(String(body.media || ""), 200) || null;
    const territories = clampText(String(body.territories || ""), 200) || null;
    const term = clampText(String(body.term || ""), 200) || null;

    const budgetAmount = Number.isFinite(Number(body.budgetAmount))
      ? Number(body.budgetAmount)
      : null;
    const budgetCurrencyInput =
      typeof body.budgetCurrency === "string" ? body.budgetCurrency.toUpperCase() : "";
    const budgetCurrency: Currency | null = (["CLP", "USD", "EUR"] as const).includes(
      budgetCurrencyInput as Currency
    )
      ? (budgetCurrencyInput as Currency)
      : null;

    const mfn = Boolean(body.mfn);
    const needWhitelist = Boolean(body.needWhitelist);

    const uses: string[] = Array.isArray(body.uses) ? body.uses.map((s: any) => String(s)) : [];
    const restrictionsArr: string[] = toStringArray(body.restrictions); // ← Prisma espera String[]

    const notes = clampText(String(body.notes || ""), 2000) || null;

    const trackId = String(body.trackId || "");
    const trackTitle = clampText(String(body.trackTitle || ""), 400);
    const trackArtist = clampText(String(body.trackArtist || ""), 400);
    const trackDurationSec = Number.isFinite(Number(body.trackDurationSec)) ? Number(body.trackDurationSec) : null;
    const trackOwner = trackId
      ? await prisma.track.findUnique({
          where: { id: trackId },
          select: { ownerUserId: true },
        })
      : null;

    // f) Dedupe suave (email+track en ±1h)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const maybeDup = trackId
      ? await prisma.licensingRequest.findFirst({
          where: { email, trackId, createdAt: { gte: oneHourAgo } },
          select: { id: true },
        })
      : null;

    // g) Headers (Next 15): usa req.headers (Web Headers), no `headers()`
    const ua = req.headers.get("user-agent") || "";
    const ip = getClientIp(req.headers); // nuestra helper acepta Headers Web estándar

    // h) Crear en Prisma
    const created = await prisma.licensingRequest.create({
      data: {
        status: "NEW",
        priority: "MEDIUM",
        assignee: null,
        ownerUserId: trackOwner?.ownerUserId ?? null,

        name, email, company,
        projectType, media, territories, term,
        budgetAmount, budgetCurrency,
        mfn, needWhitelist,

        uses,                     // String[]
        restrictions: restrictionsArr, // String[]  ← FIX
        notes,

        trackId: trackId || "",
        trackTitle,
        trackArtist,
        trackDurationSec,

        pageUrl: req.headers.get("referer") || "",
        rawPayload: {
          meta: {
            userAgent: ua,
            ip,
            duplicateWithinHour: Boolean(maybeDup),
            startedAt: Number(body.startedAt) || 0,
          },
          form: {
            name, email, company, projectType, media, territories, term,
            budgetAmount, budgetCurrency, mfn, needWhitelist, uses,
            restrictions: restrictionsArr, // guardamos también como array
            notes,
            trackId, trackTitle, trackArtist, trackDurationSec,
          },
        },
      },
      select: { id: true },
    });

    // i) Sync a Sheets
    await sendLicensingSync(created.id, "created", "public");

    // j) Set cookie de rate-limit (aquí sí podemos escribir cookies)
    const res = NextResponse.json({ ok: true, id: created.id });
    res.cookies.set("lr_last", String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
    return res;
  } catch (err) {
    console.error("[api/licensing/request] error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
