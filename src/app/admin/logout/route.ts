// src/app/admin/logout/route.ts
/**
 * POST /admin/logout — borra la cookie `admin_key` y redirige a /admin/login
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
  const c = await cookies();
  c.set("admin_key", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
