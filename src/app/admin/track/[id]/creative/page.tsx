/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/app/admin/track/[id]/creative/page.tsx                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Server Component que muestra y guarda datos “Creativos” del track:        │
 * │   título, artista, moods y uses.                                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Problema común: inputs con `defaultValue` en Client Components no         │
 * │   “escuchan” cambios del servidor a menos que el formulario se remonte.     │
 * │   Por eso aquí usamos `key={track.updatedAt}` en <CreativeForm />.          │
 * │ - La Server Action:                                                         │
 * │   • Normaliza listas (moods/uses).                                          │
 * │   • Hace `db.track.update(...)`.                                            │
 * │   • Llama `revalidatePath` para refrescar la página.                        │
 * │   • Retorna siempre { ok, message } (el form no crashea si algo falla).     │
 * │ - `export const dynamic = "force-dynamic"` asegura que no nos sirvan un     │
 * │   render cacheado en dev.                                                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import CreativeForm from "@/components/admin/track/CreativeForm";
import { db } from "@/server/db";

export const dynamic = "force-dynamic"; // ← forzamos evaluación dinámica en cada request

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

// Helper porque Next 15 a veces entrega params como Promise
async function readParams(params: Props["params"]): Promise<{ id: string }> {
  return "then" in (params as any)
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string });
}

// Convierte “texto con comas o saltos de línea” → array único, UPPERCASE, sin vacíos ni duplicados
function toCleanList(input: string | null | undefined): string[] {
  if (!input) return [];
  return Array.from(
    new Set(
      input
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.toUpperCase()),
    ),
  );
}

export default async function CreativePage({ params }: Props) {
  const { id } = await readParams(params);

  // Leemos el track con los campos creativos que editamos
  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      moods: true, // string[] o JSON en tu esquema
      uses: true, // string[] o JSON en tu esquema
      updatedAt: true, // ← Prisma @updatedAt (lo usamos para key)
    },
  });

  if (!track) notFound();

  // Server Action (vive en el Server Component; se inyecta al form cliente)
  async function updateCreative(formData: FormData) {
    "use server";
    try {
      // Leemos los campos del form
      const title = (formData.get("title") as string | null)?.trim() || null;
      const artist = (formData.get("artist") as string | null)?.trim() || null;

      // Moods/Uses vienen como texto (comas/saltos de línea) → lista limpia
      const moods = toCleanList(formData.get("moods") as string | null);
      const uses = toCleanList(formData.get("uses") as string | null);

      // Guardamos. Si en tu esquema moods/uses son JSONB, string[] funciona como InputJsonValue
      await db.track.update({
        where: { id: track.id },
        data: { title, artist, moods, uses },
        select: { id: true },
      });

      // Revalidamos esta ruta para que el Server Component recalcule
      revalidatePath(`/admin/track/${track.id}/creative`);

      // Devolvemos un resultado consistente
      return { ok: true, message: "Guardado" };
    } catch (err) {
      console.error("[creative:update] fatal:", err);
      return { ok: false, message: "Error al guardar" };
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Creativo</h1>
        <p className="text-sm text-gray-500">
          Edición de título, artista, moods y uses (para mejorar
          búsqueda/descubrimiento).
        </p>
      </header>

      {/* CLAVE: forzamos el remount del formulario cuando cambia updatedAt */}
      <CreativeForm
        key={
          track.updatedAt
            ? new Date(track.updatedAt).toISOString()
            : "no-updatedAt"
        }
        track={track}
        updateCreative={updateCreative}
      />

      <section className="rounded-md border border-gray-200 p-4">
        <h2 className="mb-2 text-lg font-medium">Sugerencias</h2>
        <ul className="list-inside list-disc text-sm text-gray-600">
          <li>
            Usa 3–6 “moods” claros (ej. enérgico, íntimo, épico, nostálgico).
          </li>
          <li>
            “Uses” orienta al sync (publicidad, tráiler, documental, social,
            gaming…).
          </li>
        </ul>
      </section>
    </div>
  );
}
