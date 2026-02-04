/**
 * Recibe POST con JSON del diálogo D3 y guarda en BD (LicensingRequest).
 * Luego, opcionalmente reenvía el JSON al webhook (Slack/Discord/Zapier/etc.).
 */
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type AnyObj = Record<string, any>;

export async function POST(req: NextRequest) {
  let payload: AnyObj | null = null;

  try {
    payload = (await req.json()) as AnyObj;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  // Extracción segura con defaults
  const applicant = (payload.applicant ?? {}) as AnyObj;
  const project = (payload.project ?? {}) as AnyObj;
  const track = (payload.track ?? {}) as AnyObj;

  // Email mínimo para no almacenar basura
  const okEmail = typeof applicant.email === "string" && /\S+@\S+\.\S+/.test(applicant.email);
  if (!okEmail) {
    return NextResponse.json({ ok: false, error: "Email requerido" }, { status: 400 });
  }

  // Presupuesto: puede venir como "700000 CLP" desde el cliente
  type Currency = "CLP" | "USD" | "EUR";
  let budgetAmount: number | null = null;
  let budgetCurrency: Currency | null = null;

  if (typeof project.budget === "string" && project.budget.trim().length) {
    const parts = project.budget.trim().split(/\s+/);
    const maybeAmount = parseInt(parts[0] ?? "", 10);
    const maybeCurr = (parts[1] ?? "").toUpperCase();
    if (Number.isFinite(maybeAmount)) budgetAmount = maybeAmount;
    if (["CLP", "USD", "EUR"].includes(maybeCurr)) {
      budgetCurrency = maybeCurr as typeof budgetCurrency;
    }
  }

  // Arrays
  const arr = (v: any) => (Array.isArray(v) ? (v as string[]).filter(Boolean) : ([] as string[]));

  // Guardado en BD
  const record = await prisma.licensingRequest.create({
    data: {
      name: String(applicant.name ?? "").slice(0, 255),
      email: String(applicant.email ?? "").slice(0, 255),
      company: applicant.company ? String(applicant.company).slice(0, 255) : null,

      projectType: String(project.projectType ?? "Otro").slice(0, 100),
      media: project.media ? String(project.media).slice(0, 100) : null,
      territories: project.territories ? String(project.territories).slice(0, 200) : null,
      term: project.term ? String(project.term).slice(0, 100) : null,
      budgetAmount,
      budgetCurrency,
      mfn: Boolean(project.mfn),
      needWhitelist: Boolean(project.needWhitelist),
      notes: project.notes ? String(project.notes) : null,

      trackId: String(track.id ?? "unknown").slice(0, 64),
      trackTitle: track.title ? String(track.title).slice(0, 255) : null,
      trackArtist: track.artist ? String(track.artist).slice(0, 255) : null,
      trackDurationSec:
        typeof track.durationSec === "number" && Number.isFinite(track.durationSec)
          ? Math.round(track.durationSec)
          : null,
      moods: arr(track.moods),
      uses: arr(track.uses),
      restrictions: arr(track.restrictions),

      pageUrl: typeof payload.pageUrl === "string" ? payload.pageUrl : null,
      rawPayload: payload,
    },
    select: { id: true, createdAt: true },
  });

  // Webhook opcional
  const hook = process.env.LICENSING_WEBHOOK_URL;
  if (hook && /^https?:\/\//i.test(hook)) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("[contact] webhook failed:", (err as Error).message);
    }
  }

  return NextResponse.json({ ok: true, id: record.id, createdAt: record.createdAt });
}
