import { notFound } from "next/navigation";
import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";

type CreatorTrackDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CreatorTrackDetailPage({ params }: CreatorTrackDetailPageProps) {
  const user = await requireRole(["CREATOR"], { redirectTo: "/auth/login?next=/creator/tracks" });
  if (!user) return null;

  const { id } = await params;
  const track = await prisma.track.findFirst({
    where: {
      id,
      ownerUserId: user.id,
    },
    select: {
      id: true,
      title: true,
      artist: true,
      updatedAt: true,
      audioUrl: true,
      coverUrl: true,
    },
  });

  if (!track) notFound();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Track propio</h1>
        <p className="text-sm text-muted-foreground">ID: {track.id}</p>
      </div>

      <form
        method="POST"
        action={`/creator/tracks/${track.id}/update`}
        className="space-y-4 rounded-xl border border-border p-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Título</label>
            <input
              type="text"
              name="title"
              defaultValue={track.title}
              required
              className="w-full rounded-lg border border-border bg-muted px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Artista</label>
            <input
              type="text"
              name="artist"
              defaultValue={track.artist}
              required
              className="w-full rounded-lg border border-border bg-muted px-3 py-2"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Última actualización: {track.updatedAt.toLocaleString("es-CL")}
        </div>

        <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
          Guardar cambios básicos
        </button>
      </form>
    </section>
  );
}

