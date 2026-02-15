import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminListHeader, AdminListShell, AdminStatusBadge } from "@/components/admin/list-kit";
import { ContractDetailEditor } from "@/components/admin/contracts/ContractDetailEditor";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function formatAmount(value: number | null, currency: "CLP" | "USD" | "EUR") {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Page({ params }: RouteContext) {
  const { id } = await params;
  const contract = await prisma.contractRecord.findUnique({
    where: { id },
    select: {
      id: true,
      contractNumber: true,
      title: true,
      counterpartyName: true,
      counterpartyEmail: true,
      status: true,
      amount: true,
      currency: true,
      startsAt: true,
      endsAt: true,
      signedAt: true,
      fileUrl: true,
      notes: true,
      requestId: true,
      trackId: true,
      createdAt: true,
      updatedAt: true,
      track: {
        select: { id: true, title: true, artist: true },
      },
    },
  });

  if (!contract) notFound();

  return (
    <section>
      <AdminListShell className="bg-muted/30">
        <AdminListHeader
          title={contract.contractNumber}
          subtitle={contract.title}
          count={<AdminStatusBadge>{contract.status}</AdminStatusBadge>}
          actionSlot={
            <Link
              href="/admin/contracts"
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45"
            >
              ← Volver
            </Link>
          }
        />

        <div className="space-y-4 px-4 py-4 text-sm">
          <ContractDetailEditor
            item={{
              id: contract.id,
              contractNumber: contract.contractNumber,
              title: contract.title,
              counterpartyName: contract.counterpartyName,
              counterpartyEmail: contract.counterpartyEmail,
              status: contract.status,
              amount: contract.amount,
              currency: contract.currency,
              notes: contract.notes,
              requestId: contract.requestId,
              trackId: contract.trackId,
            }}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Contraparte" value={contract.counterpartyName} />
            <Info label="Email contraparte" value={contract.counterpartyEmail ?? "—"} />
            <Info label="Monto" value={formatAmount(contract.amount, contract.currency)} />
            <Info label="Request ID" value={contract.requestId ?? "—"} mono />
            <Info label="Track ID" value={contract.trackId ?? "—"} mono />
            <Info label="Archivo" value={contract.fileUrl ?? "—"} mono />
            <Info label="Inicio" value={formatDate(contract.startsAt)} />
            <Info label="Fin" value={formatDate(contract.endsAt)} />
            <Info label="Firma" value={formatDate(contract.signedAt)} />
            <Info label="Actualizado" value={formatDate(contract.updatedAt)} />
          </div>

          {contract.track ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Track relacionado</p>
              <Link
                href={`/admin/tracks/${contract.track.id}/edit`}
                className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/45"
              >
                {contract.track.title} · {contract.track.artist}
              </Link>
            </div>
          ) : null}

          {contract.notes ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</p>
              <p className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm whitespace-pre-wrap">{contract.notes}</p>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">Creado: {formatDate(contract.createdAt)}</p>
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
