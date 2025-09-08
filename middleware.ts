/**
 * Protección de rutas /admin/* con doble modo:
 * - Basic Auth (ADMIN_USER / ADMIN_PASS)
 * - Clave por URL ?key= (ADMIN_ACCESS_KEY) con cookie httpOnly persistente
 *
 * Notas:
 * - En producción la cookie se marca `secure: true`.
 * - Si no defines ADMIN_PASS ni ADMIN_ACCESS_KEY, se devuelve 500 para evitar
 *   dejar el panel expuesto por error.
 */
import { NextRequest, NextResponse } from "next/server";

function unauthorized(realm = "Lynx Admin") {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${realm}"` },
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Por seguridad defensiva; de todas formas el matcher limita a /admin/*
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Permitir preflight
  if (req.method === "OPTIONS") {
    return NextResponse.next();
  }

  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS || "";
  const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || "";

  if (!ADMIN_PASS && !ADMIN_KEY) {
    return new NextResponse(
      "Configure ADMIN_PASS o ADMIN_ACCESS_KEY en el entorno para proteger /admin/*",
      { status: 500 },
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Intento Basic Auth
  // ────────────────────────────────────────────────────────────────────────────
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const base64 = auth.split(" ")[1]!;
      const decoded = atob(base64); // Middleware corre en Edge, atob está disponible
      const [user, pass] = decoded.split(":");
      if (user === ADMIN_USER && ADMIN_PASS && pass === ADMIN_PASS) {
        return NextResponse.next();
      }
    } catch {
      // Ignora y continúa con el resto de validaciones
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Clave por URL (tu flujo actual) → set cookie y redirige sin ?key
  // ────────────────────────────────────────────────────────────────────────────
  const keyFromQuery = req.nextUrl.searchParams.get("key");
  const cookieKey = req.cookies.get("admin_key")?.value;

  if (ADMIN_KEY && keyFromQuery && keyFromQuery === ADMIN_KEY) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("key");

    const res = NextResponse.redirect(url);
    res.cookies.set({
      name: "admin_key",
      value: ADMIN_KEY,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    return res;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3) Cookie válida → acceso
  // ────────────────────────────────────────────────────────────────────────────
  if (ADMIN_KEY && cookieKey === ADMIN_KEY) {
    return NextResponse.next();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4) Sin credenciales → 401 con WWW-Authenticate para clientes/CI
  // ────────────────────────────────────────────────────────────────────────────
  return unauthorized();
}

export const config = {
  matcher: ["/admin/:path*"],
};
