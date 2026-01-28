import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchCatalogTracks } from "@/lib/catalog/fetchCatalog";

const schema = z.object({
  catalogSlug: z.string().trim().min(1).optional(),
  moods: z.array(z.string().trim().min(1)).optional(),
  uses: z.array(z.string().trim().min(1)).optional(),
  artist: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  includeWaveform: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Payload inválido",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const tracks = await fetchCatalogTracks(parsed.data);
    return NextResponse.json({ ok: true, tracks });
  } catch (error) {
    console.error("[api/catalog/list] error", error);
    return NextResponse.json(
      { ok: false, message: "Error interno" },
      { status: 500 },
    );
  }
}
