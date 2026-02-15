import { NextRequest, NextResponse } from "next/server";
import { PlaylistStatus, PlaylistVisibility, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";

function canManageAdminModules(role: "ADMIN" | "STAFF" | "CREATOR") {
  return role === "ADMIN" || role === "STAFF";
}

const schema = z
  .object({
    ids: z.array(z.string().trim().min(1)).min(1).max(500),
    action: z.enum(["set_status", "set_visibility", "set_featured", "delete"]),
    status: z.nativeEnum(PlaylistStatus).optional(),
    visibility: z.nativeEnum(PlaylistVisibility).optional(),
    featured: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "set_status" && !value.status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "status requerido" });
    }
    if (value.action === "set_visibility" && !value.visibility) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility"],
        message: "visibility requerido",
      });
    }
    if (value.action === "set_featured" && value.featured === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["featured"],
        message: "featured requerido",
      });
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
    result = await prisma.playlist.deleteMany({ where: { id: { in: ids } } });
  } else if (parsed.data.action === "set_status" && parsed.data.status) {
    result = await prisma.playlist.updateMany({
      where: { id: { in: ids } },
      data: { status: parsed.data.status },
    });
  } else if (parsed.data.action === "set_visibility" && parsed.data.visibility) {
    result = await prisma.playlist.updateMany({
      where: { id: { in: ids } },
      data: { visibility: parsed.data.visibility },
    });
  } else if (parsed.data.action === "set_featured" && parsed.data.featured !== undefined) {
    result = await prisma.playlist.updateMany({
      where: { id: { in: ids } },
      data: { featured: parsed.data.featured },
    });
  }

  return NextResponse.json({ ok: true, affected: result.count });
}
