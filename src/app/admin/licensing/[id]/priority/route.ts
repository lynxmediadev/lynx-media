/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ API: POST /admin/licensing/[id]/priority                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Guarda priority (LOW|MEDIUM|HIGH).                                        │
 * │ - Tras actualizar en BD, invalida el detalle y el listado con               │
 * │   `revalidatePath` para evitar ver datos viejos al volver/navegar.          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

const ALLOWED = new Set(["LOW", "MEDIUM", "HIGH"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const body = (await req.json()) as { priority?: string };
    const next = String(body?.priority ?? "").toUpperCase();

    if (!ALLOWED.has(next)) {
      return NextResponse.json(
        { ok: false, error: "Prioridad inválida" },
        { status: 400 }
      );
    }

    await prisma.licensingRequest.update({
      where: { id },
      data: { priority: next as any },
    });

    // ⬇️ Invalida caché de detalle y listado para ver el nuevo valor al instante
    revalidatePath("/admin/licensing");
    revalidatePath(`/admin/licensing/${id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[priority:update] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar la prioridad" },
      { status: 500 }
    );
  }
}
