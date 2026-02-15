import Link from "next/link";

import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";

export default async function CreatorOverviewPage() {
  const user = await requireRole(["CREATOR"], { redirectTo: "/auth/login?next=/creator" });
  if (!user) return null;

  const [tracksCount, requestsCount, lastTrackUpdate] = await Promise.all([
    prisma.track.count({ where: { ownerUserId: user.id } }),
    prisma.licensingRequest.count({ where: { ownerUserId: user.id } }),
    prisma.track.findFirst({
      where: { ownerUserId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu espacio creator con acceso directo a tracks y requests.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracks propios</p>
          <p className="mt-2 text-2xl font-semibold">{tracksCount}</p>
        </article>

        <article className="rounded-xl border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Requests asociadas</p>
          <p className="mt-2 text-2xl font-semibold">{requestsCount}</p>
        </article>

        <article className="rounded-xl border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Última actualización</p>
          <p className="mt-2 text-sm font-medium">
            {lastTrackUpdate?.updatedAt
              ? lastTrackUpdate.updatedAt.toLocaleString("es-CL")
              : "Sin actividad"}
          </p>
        </article>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/creator/tracks"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          Ver tracks
        </Link>
        <Link
          href="/creator/requests"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          Ver requests
        </Link>
        <Link
          href="/creator/account"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          Ir a account
        </Link>
      </div>
    </section>
  );
}
