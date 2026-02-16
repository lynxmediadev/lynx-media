import { NextRequest, NextResponse } from "next/server";
import { ContractStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";

function canManageAdminModules(role: string) {
  return role === "ADMIN" || role === "STAFF";
}

const schema = z
  .object({
    ids: z.array(z.string().trim().min(1)).min(1).max(500),
    action: z.enum(["set_status", "delete"]),
    status: z.nativeEnum(ContractStatus).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "set_status" && !value.status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "status requerido" });
    }
  });

export async function POST(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const ids = Array.from(new Set(parsed.data.ids));
  let result: Prisma.BatchPayload = { count: 0 };

  if (parsed.data.action === "delete") {
    result = await prisma.contractRecord.deleteMany({ where: { id: { in: ids } } });
  } else if (parsed.data.action === "set_status" && parsed.data.status) {
    result = await prisma.contractRecord.updateMany({
      where: { id: { in: ids } },
      data: { status: parsed.data.status },
    });
  }

  return NextResponse.json({ ok: true, affected: result.count });
}
