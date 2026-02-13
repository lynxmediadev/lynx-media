import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAdmin, safeRouteRedirect } from "@/lib/account-auth/route-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/admin/users")) return "/admin/users";
  return value;
}

function addResultParams(path: string, values: Record<string, string>) {
  const url = new URL(path, "http://localhost");
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const admin = await requireRouteAdmin();
  if (!admin) {
    return NextResponse.redirect(safeRouteRedirect(req, "/admin/login?err=1"), { status: 303 });
  }

  const { id } = await context.params;
  const formData = await req.formData();
  const returnTo = safeReturnTo((formData.get("returnTo")?.toString() ?? "").trim());
  const name = (formData.get("name")?.toString() ?? "").trim();

  await prisma.user.update({
    where: { id },
    data: {
      name: name || null,
    },
  });

  return NextResponse.redirect(
    safeRouteRedirect(req, addResultParams(returnTo, { ok: "user_updated" })),
    { status: 303 },
  );
}

