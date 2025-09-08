/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ API: POST /admin/licensing/[id]/assignee                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Next 15 exige AWAIT a `params` en Route Handlers (es una Promise).        │
 * │ - Recibe { assignee } y actualiza el responsable (o lo deja NULL si vacío). │
 * │ - Hereda auth del middleware /admin/*                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // 👈 params es Promise en Next 15
) {
  try {
    // ✅ Desempaquetamos el id con await
    const { id } = await ctx.params;

    const body = (await req.json()) as { assignee?: string };
    const raw = (body.assignee ?? "").trim();

    if (raw.length > 120) {
      return NextResponse.json(
        { ok: false, error: "El responsable es demasiado largo (máx. 120)" },
        { status: 400 }
      );
    }

    await prisma.licensingRequest.update({
      where: { id }, // ← ya tenemos id
      data: { assignee: raw.length ? raw : null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[assignee:update] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar el responsable" },
      { status: 500 }
    );
  }
}
