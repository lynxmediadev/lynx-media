// src/middleware.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ middleware — Guard real para /admin/** usando cookie `admin_key`            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Permite /admin/login y /admin/login/submit.                               │
 * │ - Para el resto de /admin/** exige cookie `admin_key` == (KEY || PASS).     │
 * │ - Incluye logs de diagnóstico si DEBUG_ADMIN_MW=1 (quítalos luego).         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  const debug = process.env.DEBUG_ADMIN_MW === "1";
  const { pathname } = req.nextUrl;

  // Permitir login UI y submit
  if (pathname === "/admin/login" || pathname === "/admin/login/submit") {
    if (debug) console.log("[MW allow]", pathname);
    return NextResponse.next();
  }

  // Valor esperado (KEY prioritaria; fallback PASS), todo con trim()
  const ENV_PASS = (process.env.ADMIN_PASS ?? "").trim();
  const ENV_KEY  = (process.env.ADMIN_ACCESS_KEY ?? "").trim();
  const expected = (ENV_KEY || ENV_PASS).trim();

  if (!expected) {
    if (debug) console.log("[MW error] No expected key configured");
    return new NextResponse("Admin not configured", { status: 500 });
  }

  // Leer cookie
  const cookieKey = (req.cookies.get("admin_key")?.value ?? "").trim();
  if (debug) console.log("[MW check]", { path: pathname, hasCookie: Boolean(cookieKey), match: cookieKey === expected });

  // ¿Cookie válida?
  if (cookieKey === expected) {
    return NextResponse.next();
  }

  // (Opcional) Basic Auth como respaldo (misma clave)
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const base64 = auth.split(" ")[1]!;
      const [user, pass] = atob(base64).split(":");
      if ((pass ?? "").trim() === expected) {
        if (debug) console.log("[MW basic-auth] pass match");
        return NextResponse.next();
      }
    } catch {}
  }

  // Sin cookie o no coincide → redirigir a login
  if (debug) console.log("[MW redirect]", pathname, "→ /admin/login");
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
