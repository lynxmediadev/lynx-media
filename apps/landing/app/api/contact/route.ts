import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

type ContactPayload = {
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  website: string;
};

type ParsedRequest = {
  payload: ContactPayload;
  mode: "json" | "form";
};

type BrevoSendInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  tags: string[];
};

const RATE_WINDOW_MS = Number(process.env.LANDING_CONTACT_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000);
const RATE_MAX = Number(process.env.LANDING_CONTACT_RATE_LIMIT_MAX ?? 5);
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

declare global {
  var __landingContactPool: Pool | undefined;
  var __landingContactRateHits: Map<string, number[]> | undefined;
}

function getPool() {
  if (!process.env.LANDING_DATABASE_URL) {
    throw new Error("Missing LANDING_DATABASE_URL");
  }
  if (!global.__landingContactPool) {
    const rawConnectionString = process.env.LANDING_DATABASE_URL;
    const normalizedConnectionString = (() => {
      try {
        const url = new URL(rawConnectionString);
        // `pg` en este entorno interpreta `sslmode=require` como verificación estricta
        // y termina fallando con certificados self-signed en algunos setups (WSL/Supabase).
        // Quitamos `sslmode` del DSN y delegamos SSL al objeto `ssl` explícito.
        url.searchParams.delete("sslmode");
        return url.toString();
      } catch {
        return rawConnectionString;
      }
    })();

    global.__landingContactPool = new Pool({
      connectionString: normalizedConnectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global.__landingContactPool;
}

function getRateStore() {
  if (!global.__landingContactRateHits) {
    global.__landingContactRateHits = new Map<string, number[]>();
  }
  return global.__landingContactRateHits;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function normalizeText(input: unknown) {
  if (typeof input !== "string") return "";
  return input.trim();
}

function validatePayload(payload: ContactPayload) {
  const errors: string[] = [];
  if (payload.website.trim()) errors.push("spam_honeypot");
  if (payload.name.length < 2 || payload.name.length > 120) errors.push("name_invalid");
  if (payload.email.length < 5 || payload.email.length > 320) errors.push("email_invalid");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) errors.push("email_format");
  if (payload.company && payload.company.length > 160) errors.push("company_invalid");
  if (payload.message.length < 10 || payload.message.length > 4000) errors.push("message_invalid");
  return errors;
}

function checkRateLimit(ip: string) {
  const store = getRateStore();
  const now = Date.now();
  const start = now - RATE_WINDOW_MS;
  const existing = store.get(ip) ?? [];
  const active = existing.filter((hit) => hit >= start);
  if (active.length >= RATE_MAX) {
    store.set(ip, active);
    return false;
  }
  active.push(now);
  store.set(ip, active);
  return true;
}

async function parsePayload(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      mode: "json",
      payload: {
        name: normalizeText(body.name),
        email: normalizeText(body.email).toLowerCase(),
        company: normalizeText(body.company) || null,
        message: normalizeText(body.message),
        source: normalizeText(body.source) || "landing_contact",
        website: normalizeText(body.website),
      },
    };
  }

  const formData = await request.formData();
  return {
    mode: "form",
    payload: {
      name: normalizeText(formData.get("name")),
      email: normalizeText(formData.get("email")).toLowerCase(),
      company: normalizeText(formData.get("company")) || null,
      message: normalizeText(formData.get("message")),
      source: normalizeText(formData.get("source")) || "landing_contact",
      website: normalizeText(formData.get("website")),
    },
  };
}

function redirectWithStatus(request: Request, status: string) {
  const url = new URL(request.url);
  url.pathname = "/";
  url.searchParams.set("contact", status);
  return NextResponse.redirect(url, { status: 303 });
}

function getLandingEmailProvider() {
  return (process.env.LANDING_CONTACT_EMAIL_PROVIDER ?? "console").trim().toLowerCase();
}

function shouldSendAutoReply() {
  return (process.env.LANDING_CONTACT_SEND_AUTOREPLY ?? "0").trim() === "1";
}

function getAutoReplySubject() {
  const subject = (process.env.LANDING_CONTACT_AUTOREPLY_SUBJECT ?? "").trim();
  return subject || "Recibimos tu mensaje · Lynx Media";
}

function getBrevoConfig() {
  const apiKey = (process.env.LANDING_BREVO_API_KEY ?? process.env.BREVO_API_KEY ?? "").trim();
  const fromEmail = (process.env.LANDING_CONTACT_FROM_EMAIL ?? process.env.AUTH_EMAIL_FROM ?? "").trim();
  const fromName = (process.env.LANDING_CONTACT_FROM_NAME ?? "Lynx Media").trim();
  if (!apiKey || !fromEmail) return null;
  return { apiKey, fromEmail, fromName };
}

async function sendBrevoEmail(input: BrevoSendInput) {
  const config = getBrevoConfig();
  if (!config) {
    throw new Error("landing_brevo_missing_credentials");
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        sender: {
          email: config.fromEmail,
          name: config.fromName,
        },
        to: [{ email: input.to }],
        subject: input.subject,
        textContent: input.text,
        htmlContent: input.html,
        tags: input.tags,
      }),
    });

    if (response.ok) return;
    const body = await response.text();
    if (attempt < 2 && BREVO_RETRYABLE_STATUS.has(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      continue;
    }
    throw new Error(`landing_brevo_http_${response.status}:${body.slice(0, 320)}`);
  }
}

function buildNotification(input: {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  ip: string;
}) {
  const companyText = input.company ? `Empresa: ${input.company}` : "Empresa: -";
  const text = [
    "Nuevo contacto Landing",
    `ID: ${input.id}`,
    `Nombre: ${input.name}`,
    `Email: ${input.email}`,
    companyText,
    `Fuente: ${input.source}`,
    `IP: ${input.ip}`,
    "",
    "Mensaje:",
    input.message,
  ].join("\n");

  const safeMessage = input.message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br/>");
  const html = `
    <h2>Nuevo contacto Landing</h2>
    <p><strong>ID:</strong> ${input.id}</p>
    <p><strong>Nombre:</strong> ${input.name}</p>
    <p><strong>Email:</strong> ${input.email}</p>
    <p><strong>Empresa:</strong> ${input.company ?? "-"}</p>
    <p><strong>Fuente:</strong> ${input.source}</p>
    <p><strong>IP:</strong> ${input.ip}</p>
    <hr/>
    <p><strong>Mensaje</strong></p>
    <p>${safeMessage}</p>
  `;
  return { text, html };
}

function buildAutoReply(input: { name: string; message: string }) {
  const safeName = input.name.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const preview = input.message.length > 300 ? `${input.message.slice(0, 300)}...` : input.message;
  const safePreview = preview
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br/>");
  const text = [
    `Hola ${input.name},`,
    "",
    "Recibimos tu mensaje correctamente.",
    "Nuestro equipo revisará tu solicitud y te responderá a la brevedad.",
    "",
    "Resumen de tu mensaje:",
    preview,
    "",
    "Lynx Media",
  ].join("\n");
  const html = `
    <p>Hola <strong>${safeName}</strong>,</p>
    <p>Recibimos tu mensaje correctamente.</p>
    <p>Nuestro equipo revisará tu solicitud y te responderá a la brevedad.</p>
    <hr/>
    <p><strong>Resumen de tu mensaje</strong></p>
    <p>${safePreview}</p>
    <p style="margin-top:20px;">Lynx Media</p>
  `;
  return { text, html };
}

async function sendContactNotification(input: {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  ip: string;
}) {
  const notifyTarget = process.env.LANDING_CONTACT_NOTIFY_EMAIL;
  if (!notifyTarget) return;

  const provider = getLandingEmailProvider();
  const message = buildNotification(input);
  if (provider === "brevo") {
    await sendBrevoEmail({
      to: notifyTarget,
      subject: `[Landing] Nuevo contacto: ${input.name}`,
      text: message.text,
      html: message.html,
      tags: ["landing_contact"],
    });
    return;
  }

  const preview = input.message.length > 240 ? `${input.message.slice(0, 240)}...` : input.message;
  console.info(
    `[landing-contact] notify=${notifyTarget} lead=${input.id} from=${input.email} source=${input.source}\n${preview}`,
  );
}

async function sendContactAutoReply(input: { name: string; email: string; message: string }) {
  if (!shouldSendAutoReply()) return;

  const provider = getLandingEmailProvider();
  const message = buildAutoReply({ name: input.name, message: input.message });
  const subject = getAutoReplySubject();
  if (provider === "brevo") {
    await sendBrevoEmail({
      to: input.email,
      subject,
      text: message.text,
      html: message.html,
      tags: ["landing_contact_autoreply"],
    });
    return;
  }

  console.info(`[landing-contact] autoreply=${input.email}\n${message.text}`);
}

async function dispatchContactEmails(input: {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  ip: string;
}) {
  const jobs: Promise<unknown>[] = [];
  jobs.push(sendContactNotification(input));
  jobs.push(sendContactAutoReply({ name: input.name, email: input.email, message: input.message }));

  const settled = await Promise.allSettled(jobs);
  for (const result of settled) {
    if (result.status === "rejected") {
      console.error("[landing-contact] email delivery failed", result.reason);
    }
  }
}

export async function POST(request: Request) {
  let parsed: ParsedRequest;
  try {
    parsed = await parsePayload(request);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    if (parsed.mode === "form") return redirectWithStatus(request, "rate_limited");
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const validationErrors = validatePayload(parsed.payload);
  if (validationErrors.length) {
    if (parsed.mode === "form") return redirectWithStatus(request, "invalid");
    return NextResponse.json(
      { ok: false, error: "validation_error", details: validationErrors },
      { status: 400 },
    );
  }

  try {
    const pool = getPool();
    const duplicate = await pool.query(
      `SELECT 1
       FROM "ContactLead"
       WHERE "email" = $1
         AND "message" = $2
         AND "createdAt" > NOW() - INTERVAL '3 minutes'
       LIMIT 1`,
      [parsed.payload.email, parsed.payload.message],
    );
    if (duplicate.rowCount && duplicate.rowCount > 0) {
      if (parsed.mode === "form") return redirectWithStatus(request, "duplicate");
      return NextResponse.json({ ok: false, error: "duplicate" }, { status: 409 });
    }

    const id = `lead_${randomUUID()}`;
    const userAgent = request.headers.get("user-agent");
    const referer = request.headers.get("referer");
    const metadata = JSON.stringify({
      referer,
      path: new URL(request.url).pathname,
    });

    await pool.query(
      `INSERT INTO "ContactLead"
        ("id", "name", "email", "company", "message", "source", "status", "ip", "userAgent", "metadata", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4, $5, $6, CAST($7 AS "ContactLeadStatus"), $8, $9, $10::jsonb, NOW(), NOW())`,
      [
        id,
        parsed.payload.name,
        parsed.payload.email,
        parsed.payload.company,
        parsed.payload.message,
        parsed.payload.source,
        "NEW",
        ip,
        userAgent,
        metadata,
      ],
    );

    await dispatchContactEmails({
      id,
      name: parsed.payload.name,
      email: parsed.payload.email,
      company: parsed.payload.company,
      message: parsed.payload.message,
      source: parsed.payload.source,
      ip,
    });

    if (parsed.mode === "form") return redirectWithStatus(request, "sent");
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("[landing-contact] failed", error);
    if (parsed.mode === "form") return redirectWithStatus(request, "error");
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
