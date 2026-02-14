import { NextRequest, NextResponse } from "next/server";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRouteAdmin, safeRouteRedirect } from "@/lib/account-auth/route-guards";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/admin/users")) return "/admin/users";
  return value;
}

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function parseBulkAction(value: string) {
  const action = value.trim().toLowerCase();
  if (action === "set_role" || action === "set_status" || action === "delete") return action;
  return null;
}

function parseRole(value: string): UserRole | null {
  const role = value.trim().toUpperCase();
  if (role === "ADMIN" || role === "STAFF" || role === "CREATOR") return role;
  return null;
}

function parseStatus(value: string): UserStatus | null {
  const status = value.trim().toUpperCase();
  if (status === "ACTIVE" || status === "INVITED" || status === "SUSPENDED") return status;
  return null;
}

function uniqueIds(values: FormDataEntryValue[]) {
  const ids = values
    .map((value) => value.toString().trim())
    .filter(Boolean);
  return [...new Set(ids)];
}

function countAdminsAfterAction(input: {
  activeAdminsNow: number;
  targetUsers: Array<{ id: string; role: UserRole; status: UserStatus }>;
  action: "set_role" | "set_status" | "delete";
  roleValue?: UserRole;
  statusValue?: UserStatus;
}) {
  let delta = 0;
  for (const user of input.targetUsers) {
    const wasActiveAdmin = user.role === "ADMIN" && user.status === "ACTIVE";
    let willBeActiveAdmin = wasActiveAdmin;

    if (input.action === "set_role" && input.roleValue) {
      willBeActiveAdmin = input.roleValue === "ADMIN" && user.status === "ACTIVE";
    } else if (input.action === "set_status" && input.statusValue) {
      willBeActiveAdmin = user.role === "ADMIN" && input.statusValue === "ACTIVE";
    } else if (input.action === "delete") {
      willBeActiveAdmin = false;
    }

    if (wasActiveAdmin && !willBeActiveAdmin) delta -= 1;
    if (!wasActiveAdmin && willBeActiveAdmin) delta += 1;
  }

  return input.activeAdminsNow + delta;
}

export async function POST(req: NextRequest) {
  const admin = await requireRouteAdmin();
  if (!admin) {
    return NextResponse.redirect(safeRouteRedirect(req, "/admin/login?err=1"), { status: 303 });
  }

  const formData = await req.formData();
  const returnTo = safeReturnTo((formData.get("returnTo")?.toString() ?? "").trim());
  const action = parseBulkAction((formData.get("actionType")?.toString() ?? "").trim());
  const ids = uniqueIds(formData.getAll("userIds"));

  if (!action) {
    return NextResponse.redirect(safeRouteRedirect(req, withQuery(returnTo, "err", "bulk_invalid_action")), {
      status: 303,
    });
  }
  if (ids.length === 0) {
    return NextResponse.redirect(safeRouteRedirect(req, withQuery(returnTo, "err", "bulk_empty_selection")), {
      status: 303,
    });
  }
  if (ids.includes(admin.id)) {
    return NextResponse.redirect(safeRouteRedirect(req, withQuery(returnTo, "err", "self_action_blocked")), {
      status: 303,
    });
  }

  const [targetUsers, activeAdminsNow] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true, status: true },
    }),
    prisma.user.count({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
      },
    }),
  ]);

  if (targetUsers.length === 0) {
    return NextResponse.redirect(safeRouteRedirect(req, withQuery(returnTo, "err", "user_not_found")), {
      status: 303,
    });
  }

  let roleValue: UserRole | undefined;
  let statusValue: UserStatus | undefined;
  if (action === "set_role") {
    roleValue = parseRole((formData.get("role")?.toString() ?? "").trim()) ?? undefined;
    if (!roleValue) {
      return NextResponse.redirect(
        safeRouteRedirect(req, withQuery(returnTo, "err", "invalid_role")),
        { status: 303 },
      );
    }
  }
  if (action === "set_status") {
    statusValue = parseStatus((formData.get("status")?.toString() ?? "").trim()) ?? undefined;
    if (!statusValue) {
      return NextResponse.redirect(
        safeRouteRedirect(req, withQuery(returnTo, "err", "invalid_status")),
        { status: 303 },
      );
    }
  }

  const adminsAfterAction = countAdminsAfterAction({
    activeAdminsNow,
    targetUsers,
    action,
    roleValue,
    statusValue,
  });
  if (adminsAfterAction < 1) {
    return NextResponse.redirect(
      safeRouteRedirect(req, withQuery(returnTo, "err", "last_admin_protected")),
      { status: 303 },
    );
  }

  if (action === "delete") {
    await prisma.user.deleteMany({
      where: { id: { in: targetUsers.map((user) => user.id) } },
    });
  } else if (action === "set_role" && roleValue) {
    await prisma.user.updateMany({
      where: { id: { in: targetUsers.map((user) => user.id) } },
      data: { role: roleValue },
    });
  } else if (action === "set_status" && statusValue) {
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: { in: targetUsers.map((user) => user.id) } },
        data: { status: statusValue },
      }),
      ...(statusValue === "SUSPENDED"
        ? [
            prisma.userSession.deleteMany({
              where: { userId: { in: targetUsers.map((user) => user.id) } },
            }),
          ]
        : []),
    ]);
  }

  return NextResponse.redirect(
    safeRouteRedirect(req, withQuery(returnTo, "ok", "bulk_updated")),
    { status: 303 },
  );
}
