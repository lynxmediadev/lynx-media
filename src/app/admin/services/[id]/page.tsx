import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminListHeader, AdminListShell, AdminStatusBadge } from "@/components/admin/list-kit";
import { ServiceDetailEditor } from "@/components/admin/services/ServiceDetailEditor";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function categoryLabel(category: "MIX_MASTER" | "PRODUCTION" | "COMPOSITION" | "SOUND_DESIGN" | "OTHER") {
  switch (category) {
    case "MIX_MASTER":
      return "Mix / Master";
    case "PRODUCTION":
      return "Production";
    case "COMPOSITION":
      return "Composition";
    case "SOUND_DESIGN":
      return "Sound Design";
    default:
      return "Other";
  }
}

function formatRange(
  from: number | null,
  to: number | null,
  currency: "CLP" | "USD" | "EUR",
) {
  const formatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (from == null && to == null) return "—";
  if (from != null && to != null) return `${formatter.format(from)} - ${formatter.format(to)}`;
  if (from != null) return `Desde ${formatter.format(from)}`;
  return `Hasta ${formatter.format(to ?? 0)}`;
}

export default async function Page({ params }: RouteContext) {
  const { id } = await params;
  const service = await prisma.serviceOffer.findUnique({
    where: { id },
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

  if (!service) notFound();

  return (
    <section>
      <AdminListShell className="bg-muted/30">
        <AdminListHeader
          title={service.name}
          subtitle="Detalle de servicio"
          count={<AdminStatusBadge>{service.status}</AdminStatusBadge>}
          actionSlot={
            <Link
              href="/admin/services"
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
            >
              ← Volver
            </Link>
          }
        />

        <div className="space-y-4 px-4 py-4 text-sm">
          <ServiceDetailEditor
            item={{
              id: service.id,
              name: service.name,
              slug: service.slug,
              category: service.category,
              status: service.status,
              description: service.description,
              priceFrom: service.priceFrom,
              priceTo: service.priceTo,
              currency: service.currency,
              turnaroundDays: service.turnaroundDays,
              featured: service.featured,
              sortOrder: service.sortOrder,
            }}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Slug" value={service.slug} mono />
            <Info label="Categoría" value={categoryLabel(service.category)} />
            <Info label="Precio" value={formatRange(service.priceFrom, service.priceTo, service.currency)} />
            <Info
              label="Turnaround"
              value={service.turnaroundDays != null ? `${service.turnaroundDays} días` : "—"}
            />
            <Info label="Destacado" value={service.featured ? "Sí" : "No"} />
            <Info label="Orden" value={String(service.sortOrder)} />
            <Info label="Actualizado" value={formatDate(service.updatedAt)} />
          </div>

          {service.description ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción</p>
              <p className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm">{service.description}</p>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">Creado: {formatDate(service.createdAt)}</p>
        </div>
      </AdminListShell>
    </section>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-xs break-all" : "text-sm"}>{value}</p>
    </div>
  );
}
