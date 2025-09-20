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
/**
 * POST /admin/login/submit — versión usando ENV (opcional)
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ENV } from "@/lib/env";

export async function POST(req: NextRequest) {
  let pass = "";
  try {
    const fd = await req.formData();
    pass = (fd.get("password")?.toString() ?? "").trim();
  } catch {
    const body = await req.text();
    const qs = new URLSearchParams(body);
    pass = (qs.get("password") ?? "").trim();
  }

  const key = ENV.ADMIN_ACCESS_KEY();
  const pwd = ENV.ADMIN_PASS();
  const accepted = [key, pwd].filter(Boolean) as string[];
  if (!accepted.length) return NextResponse.redirect(new URL("/admin/login?err=1", req.url), { status: 303 });

  if (!accepted.includes(pass)) {
    return NextResponse.redirect(new URL("/admin/login?err=1", req.url), { status: 303 });
  }

  const expected = ENV.ADMIN_EXPECTED();

  const res = NextResponse.redirect(new URL("/admin/licensing", req.url), { status: 303 });
  const c = await cookies();
  c.set("admin_key", expected, {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
