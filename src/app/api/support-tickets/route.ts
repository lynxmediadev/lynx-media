import crypto from "node:crypto";
import { TicketSeverity, TicketSource } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/account-auth/guards";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { getClientIp, isHoneypotTripped, isTooFast } from "@/lib/antibot";
import prisma from "@/lib/prisma";

const ticketSchema = z.object({
  summary: z.string().trim().min(8).max(140),
  details: z.string().trim().min(16).max(4000),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  pageUrl: z.string().trim().max(500).optional(),
  source: z.nativeEnum(TicketSource).optional(),
  severity: z.nativeEnum(TicketSeverity).optional(),
  website: z.string().max(200).optional(),
  startedAt: z.number().optional(),
  errorDigest: z.string().trim().max(120).optional(),
});

function hashIp(ip: string) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (isHoneypotTripped(parsed.data.website)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (parsed.data.startedAt && isTooFast(parsed.data.startedAt, 800)) {
    return NextResponse.json({ ok: false, error: "too_fast" }, { status: 429 });
  }

  const ip = getClientIp(req.headers);
  const ua = req.headers.get("user-agent") ?? "unknown-ua";

  const throttle = await consumeRateLimit({
    action: "support_ticket_submit",
    fingerprint: `${ip || "unknown-ip"}|${ua}|support-ticket`,
    maxAttempts: 6,
    windowMs: 60_000,
    blockMs: 10 * 60_000,
  });

  if (!throttle.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfterSec: throttle.retryAfterSec },
      { status: 429 },
    );
  }

  const sessionUser = await getCurrentUser();
  const email = parsed.data.email?.trim() || sessionUser?.email || null;

  const created = await prisma.supportTicket.create({
    data: {
      source: parsed.data.source ?? TicketSource.MANUAL,
      severity: parsed.data.severity ?? TicketSeverity.MEDIUM,
      summary: parsed.data.summary.trim(),
      details: parsed.data.details.trim(),
      pageUrl: parsed.data.pageUrl?.trim() || req.headers.get("referer") || null,
      email,
      reporterUserId: sessionUser?.id ?? null,
      userAgent: ua.slice(0, 512),
      ipHash: hashIp(ip),
      meta: parsed.data.errorDigest ? { errorDigest: parsed.data.errorDigest } : undefined,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, ticketId: created.id }, { status: 201 });
}
