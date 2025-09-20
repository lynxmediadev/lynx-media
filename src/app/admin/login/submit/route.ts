// src/app/admin/login/submit/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ POST /admin/login/submit — acepta ADMIN_ACCESS_KEY o ADMIN_PASS             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Lee "password" robustamente (formData o x-www-form-urlencoded).           │
 * │ - Hace trim a input y envs.                                                 │
 * │ - Acepta si coincide con ADMIN_ACCESS_KEY O con ADMIN_PASS.                 │
 * │ - La cookie `admin_key` guarda SIEMPRE el valor unificado esperado          │
 * │   (KEY si existe; si no, PASS) para que el middleware valide consistente.   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  // 1) Leer password de forma robusta
  let pass = "";
  try {
    const fd = await req.formData();
    pass = (fd.get("password")?.toString() ?? "").trim();
  } catch {
    const body = await req.text();
    const qs = new URLSearchParams(body);
    pass = (qs.get("password") ?? "").trim();
  }

  // 2) Variables de entorno normalizadas
  const ENV_PASS = (process.env.ADMIN_PASS ?? "").trim();
  const ENV_KEY  = (process.env.ADMIN_ACCESS_KEY ?? "").trim();

  // 3) Aceptar si coincide con CUALQUIERA de las dos
  const candidates = [ENV_KEY, ENV_PASS].filter(Boolean); // quita strings vacíos
  const isValid = candidates.some((v) => v === pass);

  if (!isValid) {
    return NextResponse.redirect(new URL("/admin/login?err=1", req.url), { status: 303 });
  }

  // 4) Valor unificado esperado para cookie y middleware (KEY si existe, si no PASS)
  const expected = (ENV_KEY || ENV_PASS).trim();

  // 5) Setear cookie y redirigir
  const res = NextResponse.redirect(new URL("/admin/licensing", req.url), { status: 303 });
  const c = await cookies();
  c.set("admin_key", expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return res;
}
