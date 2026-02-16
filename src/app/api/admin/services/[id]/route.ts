import { NextRequest, NextResponse } from "next/server";
import { ServiceCategory, ServiceOfferStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function canManageAdminModules(role: string) {
  return role === "ADMIN" || role === "STAFF";
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(160).optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  status: z.nativeEnum(ServiceOfferStatus).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priceFrom: z.number().int().min(0).max(9_999_999).nullable().optional(),
  priceTo: z.number().int().min(0).max(9_999_999).nullable().optional(),
  currency: z.enum(["CLP", "USD", "EUR"]).optional(),
  turnaroundDays: z.number().int().min(0).max(3650).nullable().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
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

  const updated = await prisma.serviceOffer.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.priceFrom !== undefined ? { priceFrom: parsed.data.priceFrom } : {}),
      ...(parsed.data.priceTo !== undefined ? { priceTo: parsed.data.priceTo } : {}),
      ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
      ...(parsed.data.turnaroundDays !== undefined
        ? { turnaroundDays: parsed.data.turnaroundDays }
        : {}),
      ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      status: true,
      description: true,
      priceFrom: true,
      priceTo: true,
      currency: true,
      turnaroundDays: true,
      featured: true,
      sortOrder: true,
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
  await prisma.serviceOffer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
