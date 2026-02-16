import type { NextRequest } from "next/server";
import { POST as handleContactSubmit } from "../contact/route";

type ContactRequestPayload = {
  name?: string;
  email?: string;
  serviceType?: string;
  details?: string;
  urgency?: number;
  deadline?: string | null;
  pageUrl?: string | null;
};

function normalizeString(input: unknown) {
  if (typeof input !== "string") return "";
  return input.trim();
}

function formatMessage(payload: ContactRequestPayload) {
  const serviceType = normalizeString(payload.serviceType) || "No especificado";
  const details = normalizeString(payload.details) || "Sin detalle";
  const deadline = normalizeString(payload.deadline) || "No definido";
  const pageUrl = normalizeString(payload.pageUrl) || "No informado";
  const urgencyRaw = Number(payload.urgency);
  const urgency = Number.isFinite(urgencyRaw) ? String(Math.max(1, Math.min(5, urgencyRaw))) : "3";

  return [
    `Tipo de servicio: ${serviceType}`,
    `Urgencia (1-5): ${urgency}`,
    `Plazo estimado: ${deadline}`,
    `URL origen: ${pageUrl}`,
    "",
    "Detalle del proyecto:",
    details,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  let payload: ContactRequestPayload;
  try {
    payload = (await request.json()) as ContactRequestPayload;
  } catch {
    return Response.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const name = normalizeString(payload.name);
  const email = normalizeString(payload.email).toLowerCase();
  if (!name || !email) {
    return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const body = JSON.stringify({
    name,
    email,
    company: null,
    source: "landing_contact_request",
    website: "",
    message: formatMessage(payload),
  });

  const forwardedRequest = new Request(request.url.replace("/api/contact-request", "/api/contact"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      "x-real-ip": request.headers.get("x-real-ip") ?? "",
      "user-agent": request.headers.get("user-agent") ?? "",
      referer: request.headers.get("referer") ?? "",
    },
    body,
  });

  return handleContactSubmit(forwardedRequest);
}
