/**
 * Bandeja única de solicitudes (ContactRequest)
 * - Centraliza todos los serviceType (mix-master, contacto, etc.)
 * - Filtros por texto, status y serviceType; paginación simple.
 */
import { RequestStatus, Prisma } from "@prisma/client";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import RequestsAdminClient from "./_client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = { title: "Solicitudes — Admin" };
export const dynamic = "force-dynamic";

type SearchDict = Record<string, string | string[] | undefined>;
function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

function normalizeStatus(value: string | undefined) {
  if (!value) return undefined;
  const raw = value.trim();
  if ((RequestStatus as any)[raw]) return (RequestStatus as any)[raw] as RequestStatus;
  const upper = raw.toUpperCase();
  if ((RequestStatus as any)[upper]) return (RequestStatus as any)[upper] as RequestStatus;
  return undefined;
}

export default async function Page(props: { searchParams: Promise<SearchDict> }) {
  await cookies(); // gate simple

  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const statusEnum = normalizeStatus(first(sp.status));
  const serviceType = (first(sp.serviceType) ?? "").trim();
  const projectType = (first(sp.projectType) ?? "").trim();

  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(100, Math.max(1, parseInt(first(sp.per) ?? "20", 10) || 20));
  const skip = (page - 1) * per;

  const whereAND: Prisma.ContactRequestWhereInput[] = [];
  if (q) {
    whereAND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { details: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (serviceType) {
    whereAND.push({ serviceType: { equals: serviceType } });
  }
  if (statusEnum) {
    whereAND.push({ status: { equals: statusEnum } });
  }
  if (projectType && (projectType === "single" || projectType === "album")) {
    whereAND.push({
      rawPayload: {
        path: ["projectType"],
        equals: projectType,
      },
    });
  }

  const where: Prisma.ContactRequestWhereInput = whereAND.length ? { AND: whereAND } : {};

  const [rows, total, svcOptions] = await Promise.all([
    prisma.contactRequest.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: per,
      skip,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
        email: true,
        serviceType: true,
        status: true,
        urgency: true,
        details: true,
        deadlineAt: true,
        pageUrl: true,
        rawPayload: true,
      },
    }),
    prisma.contactRequest.count({ where }),
    prisma.contactRequest.findMany({
      select: { serviceType: true },
      distinct: ["serviceType"],
      orderBy: { serviceType: "asc" },
    }),
  ]);

  const statusOptions = Object.values(RequestStatus) as string[];
  const serviceOptions = Array.from(
    new Set(svcOptions.map((s) => s.serviceType).filter(Boolean)),
  ) as string[];

  const clientRows = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt ? r.createdAt.getTime() : null,
    updatedAt: r.updatedAt ? r.updatedAt.getTime() : null,
    deadlineAt: r.deadlineAt ? r.deadlineAt.getTime() : null,
  }));

  return (
    <RequestsAdminClient
      rows={clientRows}
      total={total}
      statusOptions={statusOptions}
      serviceOptions={serviceOptions}
      initialQS={{
        q,
        status: statusEnum ?? "",
        serviceType,
        projectType,
        page,
        per,
      }}
    />
  );
}
