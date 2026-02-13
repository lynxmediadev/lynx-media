import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";

export default async function CreatorRequestsPage() {
  const user = await requireRole(["CREATOR"], { redirectTo: "/auth/login?next=/creator/requests" });
  if (!user) return null;

  const requests = await prisma.licensingRequest.findMany({
    where: { ownerUserId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      name: true,
      company: true,
      trackTitle: true,
      trackArtist: true,
      budgetAmount: true,
      budgetCurrency: true,
    },
    take: 100,
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Requests de mi catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Solo solicitudes asociadas a tracks con ownership de tu cuenta.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Solicitante</th>
              <th className="px-3 py-2 font-medium">Track</th>
              <th className="px-3 py-2 font-medium">Budget</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Aún no hay solicitudes para tu catálogo.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="border-t border-border">
                  <td className="px-3 py-2">{request.createdAt.toLocaleString("es-CL")}</td>
                  <td className="px-3 py-2">{request.status}</td>
                  <td className="px-3 py-2">
                    <div>{request.name}</div>
                    {request.company ? (
                      <div className="text-xs text-muted-foreground">{request.company}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div>{request.trackTitle || "Sin título"}</div>
                    {request.trackArtist ? (
                      <div className="text-xs text-muted-foreground">{request.trackArtist}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {request.budgetAmount && request.budgetCurrency
                      ? `${request.budgetAmount} ${request.budgetCurrency}`
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

