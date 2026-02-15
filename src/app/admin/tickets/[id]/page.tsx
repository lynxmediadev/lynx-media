import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bug, Clock3, Wrench } from "lucide-react";

import prisma from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return value.toLocaleString("es-CL");
}

function statusText(status: string) {
  if (status === "IN_PROGRESS") return "IN PROGRESS";
  return status;
}

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      summary: true,
      details: true,
      status: true,
      severity: true,
      source: true,
      pageUrl: true,
      email: true,
      userAgent: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      reporterUserId: true,
      resolvedByUserId: true,
      meta: true,
    },
  });

  if (!ticket) notFound();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/45"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a tickets
        </Link>

        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Bug className="h-4 w-4" aria-hidden="true" />
          ID: {ticket.id}
        </div>
      </div>

      <article className="rounded-xl border border-border/70 bg-background/90 p-4 sm:p-5">
        <header className="space-y-2 border-b border-border pb-3">
          <h1 className="text-xl font-semibold">{ticket.summary}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-1">Estado: {statusText(ticket.status)}</span>
            <span className="rounded-full border border-border px-2 py-1">Severidad: {ticket.severity}</span>
            <span className="rounded-full border border-border px-2 py-1">Origen: {ticket.source}</span>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-1 lg:col-span-2">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Detalle</p>
            <p className="whitespace-pre-wrap text-sm leading-6">{ticket.details}</p>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3 text-sm">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Metadata</p>
            <div className="space-y-2 text-xs">
              <p>
                <span className="text-muted-foreground">Creado:</span> {formatDate(ticket.createdAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Actualizado:</span> {formatDate(ticket.updatedAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Resuelto:</span> {formatDate(ticket.resolvedAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {ticket.email ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">Reporter user:</span> {ticket.reporterUserId ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">Resolved by:</span> {ticket.resolvedByUserId ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">URL:</span> {ticket.pageUrl ?? "-"}
              </p>
            </div>
          </div>
        </div>

        {ticket.userAgent ? (
          <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 p-3">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">User-Agent</p>
            <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{ticket.userAgent}</p>
          </div>
        ) : null}

        {ticket.meta ? (
          <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 p-3">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Meta</p>
            <pre className="mt-1 overflow-auto text-[11px] text-muted-foreground">{JSON.stringify(ticket.meta, null, 2)}</pre>
          </div>
        ) : null}

        {ticket.status === "OPEN" ? (
          <p className="mt-4 inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Ticket pendiente de triage.
          </p>
        ) : ticket.status === "IN_PROGRESS" ? (
          <p className="mt-4 inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-300">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            Ticket en investigacion.
          </p>
        ) : ticket.status === "SPAM" ? (
          <p className="mt-4 inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Marcado como spam.
          </p>
        ) : null}
      </article>
    </section>
  );
}
