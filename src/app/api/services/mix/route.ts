import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const currencySchema = z.enum(["CLP", "USD", "EUR"]);

const singleSchema = z.object({
  tracks: z.number().int().min(12).max(99),
  overMax: z.boolean(),
  drumQuantize: z.boolean(),
  vocalTracks: z.number().int().min(0).max(10),
  addons: z.object({
    acapella: z.boolean(),
    instrumental: z.boolean(),
    liveBacking: z.boolean(),
    rush: z.boolean(),
    unlimitedRevs: z.boolean(),
  }),
  pricingClp: z.number().int().nullable(),
  breakdown: z
    .array(z.object({ label: z.string(), amount: z.number() }))
    .optional()
    .default([]),
});

const albumSchema = z.object({
  songs: z.number().int().min(1),
  timeline: z.string().max(100),
  style: z.string().max(200).optional().default(""),
  notes: z.string().optional().default(""),
});

const contactSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  company: z.string().max(255).optional(),
  notes: z.string().optional(),
  phone: z.string().max(50).optional(),
});

const payloadSchema = z.object({
  projectType: z.enum(["single", "album"]),
  currency: currencySchema,
  contact: contactSchema,
  single: singleSchema.optional(),
  album: albumSchema.optional(),
  pageUrl: z.string().url().optional().nullable(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 });
  }
  const data = parsed.data;

  // anti-spam mínimo: simple throttle por email (últimos 60s)
  const recent = await prisma.contactRequest.findFirst({
    where: {
      email: data.contact.email,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes recientes. Intenta nuevamente en un minuto." },
      { status: 429 },
    );
  }

  const isAlbum = data.projectType === "album";
  const detailLines: string[] = [];
  detailLines.push(`Proyecto: ${data.projectType}`);
  detailLines.push(`Moneda: ${data.currency}`);

  if (!isAlbum && data.single) {
    detailLines.push(`Tracks: ${data.single.tracks}${data.single.overMax ? " (requiere cotizar)" : ""}`);
    detailLines.push(`Add-ons: batería=${data.single.drumQuantize}, voz=${data.single.vocalTracks}`);
    detailLines.push(
      `Extras: aca=${data.single.addons.acapella}, inst=${data.single.addons.instrumental}, live=${data.single.addons.liveBacking}, rush=${data.single.addons.rush}, revs=${data.single.addons.unlimitedRevs}`,
    );
    if (data.single.pricingClp != null) {
      detailLines.push(`Total CLP: ${data.single.pricingClp}`);
    }
  } else if (isAlbum && data.album) {
    detailLines.push(`Canciones: ${data.album.songs}`);
    detailLines.push(`Plazo: ${data.album.timeline}`);
    if (data.album.style) detailLines.push(`Estilo: ${data.album.style}`);
  }

  const detailsStr = detailLines.join(" | ").slice(0, 500);

  const record = await prisma.contactRequest.create({
    data: {
      name: data.contact.name,
      email: data.contact.email,
      company: data.contact.company ?? null,
      serviceType: "mix-master",
      details: detailsStr || "Solicitud de mix/master",
      urgency: 1,
      deadlineAt: null,
      pageUrl: data.pageUrl ?? null,
      rawPayload: data,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, id: record.id, createdAt: record.createdAt });
}
