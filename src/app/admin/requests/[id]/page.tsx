import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export const metadata: Metadata = { title: "Solicitud — Admin" };
export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const req = await prisma.contactRequest.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      email: true,
      serviceType: true,
      status: true,
      details: true,
      urgency: true,
      deadlineAt: true,
      pageUrl: true,
      rawPayload: true,
    },
  });

  if (!req) return notFound();

  const fmt = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Solicitud
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{req.serviceType}</h1>
          <p className="text-sm text-muted-foreground">{req.id}</p>
        </div>
        <Link
          href="/admin/requests"
          className="inline-flex items-center rounded-[2px] border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Volver a la lista
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[2px] border border-border bg-card/70 p-4">
          <h2 className="text-sm font-semibold text-foreground">Cliente</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="text-foreground">{req.name}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{req.email}</dd>
            </div>
            {req.pageUrl ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Origen</dt>
                <dd className="text-right text-foreground">
                  <a
                    href={req.pageUrl}
                    className="underline decoration-dotted underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {req.pageUrl}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-[2px] border border-border bg-card/70 p-4">
          <h2 className="text-sm font-semibold text-foreground">Estado</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground">{req.status}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Urgencia</dt>
              <dd className="text-foreground">{req.urgency}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Creada</dt>
              <dd className="text-foreground">{fmt.format(req.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Actualizada</dt>
              <dd className="text-foreground">{fmt.format(req.updatedAt)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Deadline</dt>
              <dd className="text-foreground">
                {req.deadlineAt ? fmt.format(req.deadlineAt) : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[2px] border border-border bg-card/70 p-4">
          <h2 className="text-sm font-semibold text-foreground">Detalle</h2>
          <p className="mt-2 text-sm text-foreground">{req.details || "—"}</p>
        </div>
      </div>

      <div className="rounded-[2px] border border-border bg-card/70 p-4">
        <h2 className="text-sm font-semibold text-foreground">Payload</h2>
        <pre className="mt-2 overflow-auto rounded-[2px] border border-border bg-background p-3 text-xs text-foreground">
          {JSON.stringify(req.rawPayload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
