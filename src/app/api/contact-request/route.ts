import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ContactPayload = {
  name?: string;
  email?: string;
  serviceType?: string;
  details?: string;
  urgency?: number;
  deadline?: string | null;
  pageUrl?: string | null;
};

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export async function POST(req: NextRequest) {
  let payload: ContactPayload | null = null;

  try {
    payload = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const serviceType = String(payload.serviceType ?? "").trim();
  const details = String(payload.details ?? "").trim();
  const urgency = Number(payload.urgency ?? 0);

  if (!name || !email || !serviceType || !details) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  if (!isEmail(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  if (!Number.isFinite(urgency) || urgency < 1 || urgency > 5) {
    return NextResponse.json({ ok: false, error: "Invalid urgency" }, { status: 400 });
  }

  let deadlineAt: Date | null = null;
  if (payload.deadline) {
    const parsed = new Date(payload.deadline);
    if (!Number.isNaN(parsed.getTime())) {
      deadlineAt = parsed;
    }
  }

  const record = await prisma.contactRequest.create({
    data: {
      name: name.slice(0, 255),
      email: email.slice(0, 255),
      serviceType: serviceType.slice(0, 120),
      details,
      urgency,
      deadlineAt,
      pageUrl: payload.pageUrl ? String(payload.pageUrl).slice(0, 500) : null,
      rawPayload: payload,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, id: record.id, createdAt: record.createdAt });
}
