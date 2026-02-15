import { NextRequest, NextResponse } from "next/server";
import { ContractStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";

function canManageAdminModules(role: "ADMIN" | "STAFF" | "CREATOR") {
  return role === "ADMIN" || role === "STAFF";
}

function parseIntSafe(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const createSchema = z.object({
  contractNumber: z.string().trim().min(3).max(80),
  title: z.string().trim().min(2).max(160),
  counterpartyName: z.string().trim().min(2).max(160),
  counterpartyEmail: z.string().trim().email().optional().nullable(),
  status: z.nativeEnum(ContractStatus).optional(),
  amount: z.number().int().min(0).max(999_999_999).optional().nullable(),
  currency: z.enum(["CLP", "USD", "EUR"]).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  signedAt: z.string().datetime().optional().nullable(),
  trackId: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const statusRaw = (req.nextUrl.searchParams.get("status") ?? "").trim().toUpperCase();
  const page = parseIntSafe(req.nextUrl.searchParams.get("page"), 1, 1, 999);
  const per = parseIntSafe(req.nextUrl.searchParams.get("per"), 20, 1, 100);

  const status = Object.values(ContractStatus).includes(statusRaw as ContractStatus)
    ? (statusRaw as ContractStatus)
    : undefined;

  const whereAND: Prisma.ContractRecordWhereInput[] = [];
  if (q) {
    whereAND.push({
      OR: [
        { contractNumber: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { counterpartyName: { contains: q, mode: "insensitive" } },
        { counterpartyEmail: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (status) whereAND.push({ status });

  const where: Prisma.ContractRecordWhereInput = whereAND.length ? { AND: whereAND } : {};
  const skip = (page - 1) * per;

  const [items, total] = await Promise.all([
    prisma.contractRecord.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
      select: {
        id: true,
        contractNumber: true,
        title: true,
        counterpartyName: true,
        counterpartyEmail: true,
        status: true,
        amount: true,
        currency: true,
        startsAt: true,
        endsAt: true,
        signedAt: true,
        trackId: true,
        requestId: true,
        updatedAt: true,
      },
    }),
    prisma.contractRecord.count({ where }),
  ]);

  return NextResponse.json({ ok: true, page, per, total, items });
}

export async function POST(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.contractRecord.create({
    data: {
      contractNumber: parsed.data.contractNumber,
      title: parsed.data.title,
      counterpartyName: parsed.data.counterpartyName,
      counterpartyEmail: parsed.data.counterpartyEmail || null,
      status: parsed.data.status ?? "DRAFT",
      amount: parsed.data.amount ?? null,
      currency: parsed.data.currency ?? "USD",
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      signedAt: parsed.data.signedAt ? new Date(parsed.data.signedAt) : null,
      trackId: parsed.data.trackId || null,
      requestId: parsed.data.requestId || null,
      notes: parsed.data.notes || null,
      ownerUserId: user.id,
    },
    select: {
      id: true,
      contractNumber: true,
      title: true,
      counterpartyName: true,
      counterpartyEmail: true,
      status: true,
      amount: true,
      currency: true,
      startsAt: true,
      endsAt: true,
      signedAt: true,
      trackId: true,
      requestId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
