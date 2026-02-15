import { NextRequest, NextResponse } from "next/server";
import { ContractStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function canManageAdminModules(role: "ADMIN" | "STAFF" | "CREATOR") {
  return role === "ADMIN" || role === "STAFF";
}

const patchSchema = z.object({
  contractNumber: z.string().trim().min(3).max(80).optional(),
  title: z.string().trim().min(2).max(160).optional(),
  counterpartyName: z.string().trim().min(2).max(160).optional(),
  counterpartyEmail: z.string().trim().email().nullable().optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  amount: z.number().int().min(0).max(999_999_999).nullable().optional(),
  currency: z.enum(["CLP", "USD", "EUR"]).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  signedAt: z.string().datetime().nullable().optional(),
  trackId: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  fileUrl: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.contractRecord.update({
    where: { id },
    data: {
      ...(parsed.data.contractNumber !== undefined ? { contractNumber: parsed.data.contractNumber } : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.counterpartyName !== undefined
        ? { counterpartyName: parsed.data.counterpartyName }
        : {}),
      ...(parsed.data.counterpartyEmail !== undefined
        ? { counterpartyEmail: parsed.data.counterpartyEmail }
        : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
      ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
      ...(parsed.data.startsAt !== undefined
        ? { startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null }
        : {}),
      ...(parsed.data.endsAt !== undefined
        ? { endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null }
        : {}),
      ...(parsed.data.signedAt !== undefined
        ? { signedAt: parsed.data.signedAt ? new Date(parsed.data.signedAt) : null }
        : {}),
      ...(parsed.data.trackId !== undefined ? { trackId: parsed.data.trackId || null } : {}),
      ...(parsed.data.requestId !== undefined ? { requestId: parsed.data.requestId || null } : {}),
      ...(parsed.data.fileUrl !== undefined ? { fileUrl: parsed.data.fileUrl || null } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
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
      fileUrl: true,
      notes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.contractRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
