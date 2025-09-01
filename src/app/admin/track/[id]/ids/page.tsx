/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/app/admin/track/[id]/ids/page.tsx                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Server Component para editar ISRC / ISWC / UPC con Server Action.         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - La Server Action SIEMPRE retorna { ok, message } y llama revalidatePath   │
 * │   para refrescar el formulario con los últimos valores guardados.           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import IdsForm from "@/components/admin/IdsForm";
import { db } from "@/server/db";

type Props = {
  params:
    | Promise<{ id: string }>
    | { id: string };
};

async function readParams(
  params: Props["params"],
): Promise<{ id: string }> {
  return "then" in (params as any) ? await (params as Promise<{ id: string }>) : (params as { id: string });
}

// Normaliza ISRC a MAYÚSCULAS y sin separadores
function normalizeISRC(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
  return s.length ? s : null;
}
// ISWC / UPC: trim; vacío → null
function normalizeSimple(raw: string | null): string | null {
  const s = (raw ?? "").trim();
  return s ? s : null;
}

export default async function IdsPage({ params }: Props) {
  const { id } = await readParams(params);

  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      isrc: true,
      iswc: true,
      upc: true,
      updatedAt: true,
    },
  });

  if (!track) notFound();

  async function updateIds(formData: FormData) {
    "use server";
    try {
      const isrc = normalizeISRC(formData.get("isrc") as string | null);
      const iswc = normalizeSimple(formData.get("iswc") as string | null);
      const upc  = normalizeSimple(formData.get("upc")  as string | null);

      await db.track.update({
        where: { id: track.id },
        data: { isrc, iswc, upc },
        select: { id: true },
      });

      revalidatePath(`/admin/track/${track.id}/ids`);

      return { ok: true, message: "Guardado" };
    } catch (err) {
      console.error("[ids:update] fatal:", err);
      return { ok: false, message: "Error al guardar" };
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Identificadores</h1>
        <p className="text-sm text-gray-500">ISRC / ISWC / UPC</p>
      </header>

      <IdsForm track={track} updateIds={updateIds} />

      <section className="rounded-md border border-gray-200 p-4">
        <h2 className="mb-2 text-lg font-medium">Ayuda rápida</h2>
        <ul className="list-inside list-disc text-sm text-gray-600">
          <li>ISRC: 12 caracteres alfanuméricos (normalizamos a mayúsculas).</li>
          <li>ISWC/UPC: guardamos tal cual (trim); vacío → null.</li>
        </ul>
      </section>
    </div>
  );
}
