/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Middleware de acceso mínimo a /admin/*                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Exige una clave (ADMIN_ACCESS_KEY) para entrar a rutas /admin/*          │
 * │ - Acepta ?key=CLAVE la primera vez; guarda cookie httpOnly y redirige sin  │
 * │   la clave en la URL. En adelante, el acceso es transparente.              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Entra una primera vez con: /admin/tracks/new?key=TU_CLAVE                │
 * │ - Si la cookie coincide, navegas libre por /admin/*                        │
 * │ - Si no hay clave o es errónea → 401 (bloquea UI admin).                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY;

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Solo protege /admin/*
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  if (!ADMIN_KEY) {
    return new NextResponse("ADMIN_ACCESS_KEY not set", { status: 500 });
  }

  const cookieKey = req.cookies.get("admin_key")?.value;
  const keyFromQuery = searchParams.get("key");

  // Si llega ?key=... y es correcta, setea cookie y redirige sin ?key
  if (keyFromQuery && keyFromQuery === ADMIN_KEY) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("key");
    const res = NextResponse.redirect(url);
    res.cookies.set({
      name: "admin_key",
      value: ADMIN_KEY,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    });
    return res;
  }

  // Si ya tienes cookie válida, deja pasar
  if (cookieKey === ADMIN_KEY) {
    return NextResponse.next();
  }

  // Si no, bloquea
  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*"],
};
