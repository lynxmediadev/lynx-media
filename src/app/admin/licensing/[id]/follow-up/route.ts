/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ API: POST /admin/licensing/[id]/follow-up                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Recibe { nextFollowUpAt?: string|null } con ISO (UTC) o null/"" (limpia). │
 * │ - Si llega string inválido → 400.                                           │
 * │ - Next 15: params es Promise → await.                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { nextFollowUpAt?: string | null };

    let value: Date | null = null;

    if (typeof body.nextFollowUpAt === "string" && body.nextFollowUpAt.trim()) {
      const d = new Date(body.nextFollowUpAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { ok: false, error: "Fecha/hora inválida" },
          { status: 400 },
        );
      }
      value = d;
    }

    await prisma.licensingRequest.update({
      where: { id },
      data: { nextFollowUpAt: value },
    });

    revalidatePath("/admin/licensing");
    revalidatePath(`/admin/licensing/${id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[followup:update] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar el follow-up" },
      { status: 500 },
    );
  }
}
