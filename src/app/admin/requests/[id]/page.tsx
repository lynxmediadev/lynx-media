import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Solicitud</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{req.serviceType}</h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wide">
              {req.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              U{req.urgency}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{req.id}</p>
        </div>
        <Button asChild variant="outline" className="rounded-[2px] text-xs">
          <Link href="/admin/requests">Volver a la lista</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Nombre</span>
              <span className="text-foreground">{req.name}</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Email</span>
              <span className="text-foreground">{req.email}</span>
            </div>
            {req.pageUrl ? (
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span>Origen</span>
                <a
                  href={req.pageUrl}
                  className="text-foreground underline decoration-dotted underline-offset-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  {req.pageUrl}
                </a>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Creada</span>
              <span className="text-foreground">{fmt.format(req.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Actualizada</span>
              <span className="text-foreground">{fmt.format(req.updatedAt)}</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Deadline</span>
              <span className="text-foreground">{req.deadlineAt ? fmt.format(req.deadlineAt) : "—"}</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Urgencia</span>
              <span className="text-foreground">U{req.urgency}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Detalle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{req.details || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="payload">
              <AccordionTrigger className="text-xs text-muted-foreground">Ver payload completo</AccordionTrigger>
              <AccordionContent>
                <pre className="mt-2 max-h-[420px] overflow-auto rounded-[2px] border border-border bg-background p-3 text-xs text-foreground">
                  {JSON.stringify(req.rawPayload, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
