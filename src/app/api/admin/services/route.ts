import { NextRequest, NextResponse } from "next/server";
import { Prisma, ServiceCategory, ServiceOfferStatus } from "@prisma/client";
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
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(160),
  category: z.nativeEnum(ServiceCategory).optional(),
  status: z.nativeEnum(ServiceOfferStatus).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  priceFrom: z.number().int().min(0).max(9_999_999).optional().nullable(),
  priceTo: z.number().int().min(0).max(9_999_999).optional().nullable(),
  currency: z.enum(["CLP", "USD", "EUR"]).optional(),
  turnaroundDays: z.number().int().min(0).max(3650).optional().nullable(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManageAdminModules(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const statusRaw = (req.nextUrl.searchParams.get("status") ?? "").trim().toUpperCase();
  const categoryRaw = (req.nextUrl.searchParams.get("category") ?? "").trim().toUpperCase();
  const page = parseIntSafe(req.nextUrl.searchParams.get("page"), 1, 1, 999);
  const per = parseIntSafe(req.nextUrl.searchParams.get("per"), 20, 1, 100);

  const status = Object.values(ServiceOfferStatus).includes(statusRaw as ServiceOfferStatus)
    ? (statusRaw as ServiceOfferStatus)
    : undefined;
  const category = Object.values(ServiceCategory).includes(categoryRaw as ServiceCategory)
    ? (categoryRaw as ServiceCategory)
    : undefined;

  const whereAND: Prisma.ServiceOfferWhereInput[] = [];
  if (q) {
    whereAND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (status) whereAND.push({ status });
  if (category) whereAND.push({ category });

  const where: Prisma.ServiceOfferWhereInput = whereAND.length ? { AND: whereAND } : {};
  const skip = (page - 1) * per;

  const [items, total] = await Promise.all([
    prisma.serviceOffer.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: per,
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
    }),
    prisma.serviceOffer.count({ where }),
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

  const created = await prisma.serviceOffer.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      category: parsed.data.category ?? "OTHER",
      status: parsed.data.status ?? "ACTIVE",
      description: parsed.data.description || null,
      priceFrom: parsed.data.priceFrom ?? null,
      priceTo: parsed.data.priceTo ?? null,
      currency: parsed.data.currency ?? "USD",
      turnaroundDays: parsed.data.turnaroundDays ?? null,
      featured: parsed.data.featured ?? false,
      sortOrder: parsed.data.sortOrder ?? 0,
      ownerUserId: user.id,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
