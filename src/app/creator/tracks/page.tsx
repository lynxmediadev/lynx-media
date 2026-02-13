import Link from "next/link";
import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";

export default async function CreatorTracksPage() {
  const user = await requireRole(["CREATOR"], { redirectTo: "/auth/login?next=/creator/tracks" });
  if (!user) return null;

  const tracks = await prisma.track.findMany({
    where: { ownerUserId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      artist: true,
      updatedAt: true,
    },
    take: 100,
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Mis tracks</h1>
        <p className="text-sm text-muted-foreground">
          Esta lista está filtrada por ownership de tu cuenta.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Título</th>
              <th className="px-3 py-2 font-medium">Artista</th>
              <th className="px-3 py-2 font-medium">Actualizado</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  No tienes tracks asignados todavía.
                </td>
              </tr>
            ) : (
              tracks.map((track) => (
                <tr key={track.id} className="border-t border-border">
                  <td className="px-3 py-2">{track.title}</td>
                  <td className="px-3 py-2">{track.artist}</td>
                  <td className="px-3 py-2">{track.updatedAt.toLocaleString("es-CL")}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/creator/tracks/${track.id}`}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Ver
                    </Link>
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
