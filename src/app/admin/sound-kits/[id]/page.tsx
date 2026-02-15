import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminListHeader, AdminListShell, AdminStatusBadge } from "@/components/admin/list-kit";
import { SoundKitDetailEditor } from "@/components/admin/sound-kits/SoundKitDetailEditor";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function formatPrice(value: number, currency: "CLP" | "USD" | "EUR") {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Page({ params }: RouteContext) {
  const { id } = await params;
  const soundKit = await prisma.soundKit.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      price: true,
      currency: true,
      coverUrl: true,
      previewUrl: true,
      featured: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!soundKit) notFound();

  return (
    <section>
      <AdminListShell className="bg-muted/30">
        <AdminListHeader
          title={soundKit.name}
          subtitle="Detalle de sound kit"
          count={<AdminStatusBadge>{soundKit.status}</AdminStatusBadge>}
          actionSlot={
            <Link
              href="/admin/sound-kits"
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
            >
              ← Volver
            </Link>
          }
        />

        <div className="space-y-4 px-4 py-4 text-sm">
          <SoundKitDetailEditor
            item={{
              id: soundKit.id,
              name: soundKit.name,
              slug: soundKit.slug,
              description: soundKit.description,
              status: soundKit.status,
              price: soundKit.price,
              currency: soundKit.currency,
              featured: soundKit.featured,
              sortOrder: soundKit.sortOrder,
            }}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Slug" value={soundKit.slug} mono />
            <Info label="Precio" value={formatPrice(soundKit.price, soundKit.currency)} />
            <Info label="Destacado" value={soundKit.featured ? "Sí" : "No"} />
            <Info label="Orden" value={String(soundKit.sortOrder)} />
            <Info label="Cover URL" value={soundKit.coverUrl ?? "—"} mono />
            <Info label="Preview URL" value={soundKit.previewUrl ?? "—"} mono />
            <Info label="Actualizado" value={formatDate(soundKit.updatedAt)} />
          </div>

          {soundKit.description ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción</p>
              <p className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm">{soundKit.description}</p>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">Creado: {formatDate(soundKit.createdAt)}</p>
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
