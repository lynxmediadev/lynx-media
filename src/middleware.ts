// src/middleware.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ middleware — Gateo /admin/** con token HMAC v1 (admin_session)              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Acepta /admin/login, /admin/login/submit, /admin/logout sin sesión.       │
 * │ - Valida admin_session: "v1.<payload>.<sig>" con ADMIN_SESSION_SECRET.      │
 * │ - Opcional: bind al User-Agent (ADMIN_BIND_UA=1) para endurecer la sesión.  │
 * │ - Legacy: por defecto DESACTIVADO; si pones ADMIN_ALLOW_LEGACY=1 se acepta  │
 * │   temporalmente la cookie antigua admin_key == (ADMIN_ACCESS_KEY || PASS).  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

function tenc(s: string) { return new TextEncoder().encode(s); }
function b64uToU8(b64url: string): Uint8Array {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hmacRaw(key: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", tenc(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, tenc(msg));
  return new Uint8Array(sig);
}
function tse(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false; let x = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    x |= ai ^ bi;
  }
  return x === 0;
}
async function sha256hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", tenc(s));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas abiertas del flujo de auth
  if (pathname === "/admin/login" || pathname === "/admin/login/submit" || pathname === "/admin/logout") {
    return NextResponse.next();
  }

  const SECRET  = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  const BIND_UA = (process.env.ADMIN_BIND_UA ?? "") === "1";
  const ALLOW_LEGACY = (process.env.ADMIN_ALLOW_LEGACY ?? "") === "1";
  const EXPECTED_LEGACY = ((process.env.ADMIN_ACCESS_KEY ?? "").trim() || (process.env.ADMIN_PASS ?? "").trim());

  // 1) Validar token HMAC v1
  const token = (req.cookies.get("admin_session")?.value ?? "").trim();
  if (SECRET && token) {
    try {
      const [v, payloadB64, sigB64] = token.split(".");
      if (v === "v1" && payloadB64 && sigB64) {
        const expSig = await hmacRaw(SECRET, payloadB64);
        const gotSig = b64uToU8(sigB64);
        if (tse(expSig, gotSig)) {
          const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
          const p = JSON.parse(json) as { sub?: string; exp?: number; ua?: string };
          if (p?.sub === "admin" && typeof p.exp === "number" && Date.now() < p.exp) {
            if (BIND_UA && p.ua) {
              const ua = req.headers.get("user-agent") || "";
              const h = await sha256hex(ua);
              if (h !== p.ua) return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
            }
            return NextResponse.next(); // ✅ token válido
          }
        }
      }
    } catch {
      // Ignoramos y probamos legacy si está permitido
    }
  }

  // 2) (Opcional) Legacy cookie admin_key (por compatibilidad temporal)
  if (ALLOW_LEGACY && EXPECTED_LEGACY) {
    const legacy = (req.cookies.get("admin_key")?.value ?? "").trim();
    if (legacy === EXPECTED_LEGACY) {
      return NextResponse.next(); // ✅ permitir mientras migras
    }
  }

  // 3) No autenticado → login
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
