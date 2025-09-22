// src/app/admin/login/submit/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ POST /admin/login/submit — emite token HMAC v1 (admin_session)              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Acepta ADMIN_ACCESS_KEY o ADMIN_PASS.                                     │
 * │ - Emite cookie httpOnly 'admin_session' con token "v1.<payload>.<sig>".     │
 * │ - TTL por defecto: 7 días (ajustable).                                      │
 * │ - Opcional: bind al user-agent si ADMIN_BIND_UA=1.                          │
 * │ - Limpia cookie antigua 'admin_key' para migrar a la nueva.                 │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { signAdminTokenV1, sha256Hex } from "@/lib/auth";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  // Leer password robusto (formData o urlencoded)
  let pass = "";
  try {
    const fd = await req.formData();
    pass = (fd.get("password")?.toString() ?? "").trim();
  } catch {
    const body = await req.text();
    const qs = new URLSearchParams(body);
    pass = (qs.get("password") ?? "").trim();
  }

  const ENV_PASS = (process.env.ADMIN_PASS ?? "").trim();
  const ENV_KEY = (process.env.ADMIN_ACCESS_KEY ?? "").trim();
  const SECRET = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  const BIND_UA = (process.env.ADMIN_BIND_UA ?? "") === "1";
  if (!SECRET)
    return NextResponse.redirect(new URL("/admin/login?err=1", req.url), {
      status: 303,
    });

  // Aceptar cualquiera de las dos
  const accepted = [ENV_KEY, ENV_PASS].filter(Boolean) as string[];
  if (!accepted.length || !accepted.includes(pass)) {
    return NextResponse.redirect(new URL("/admin/login?err=1", req.url), {
      status: 303,
    });
  }

  // Payload
  const now = Date.now();
  const ttlMs = 7 * 24 * 60 * 60 * 1000; // 7 días
  const jti = crypto.randomBytes(16).toString("hex");
  let payload = {
    sub: "admin" as const,
    iat: now,
    exp: now + ttlMs,
    jti,
  } as any;

  if (BIND_UA) {
    const h = await headers();
    const ua = h.get("user-agent") || "";
    payload.ua = sha256Hex(ua); // bind al UA
  }

  const token = signAdminTokenV1(payload, SECRET);

  // Setear nueva cookie y limpiar la antigua
  const res = NextResponse.redirect(new URL("/admin/licensing", req.url), {
    status: 303,
  });
  const c = await cookies();
  c.set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(ttlMs / 1000),
  });
  // limpiar legacy
  c.set("admin_key", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
