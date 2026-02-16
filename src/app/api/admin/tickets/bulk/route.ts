import { NextRequest, NextResponse } from "next/server";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";

function canManageTickets(role: string) {
  return role === "ADMIN" || role === "STAFF";
}

const schema = z
  .object({
    ids: z.array(z.string().trim().min(1)).min(1).max(500),
    action: z.enum(["set_status", "delete"]),
    status: z.nativeEnum(TicketStatus).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "set_status" && !value.status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "status requerido",
      });
    }
  });

export async function POST(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManageTickets(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const ids = Array.from(new Set(parsed.data.ids));

  if (parsed.data.action === "delete") {
    const result = await prisma.supportTicket.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true, affected: result.count });
  }

  const now = new Date();
  const nextStatus = parsed.data.status as TicketStatus;
  const shouldResolve = nextStatus === "RESOLVED" || nextStatus === "SPAM";

  const result = await prisma.supportTicket.updateMany({
    where: { id: { in: ids } },
    data: {
      status: nextStatus,
      resolvedAt: shouldResolve ? now : null,
      resolvedByUserId: shouldResolve ? user.id : null,
    },
  });

  return NextResponse.json({ ok: true, affected: result.count });
}
