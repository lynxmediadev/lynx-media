// src/app/api/debug/env-admin/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ GET /api/debug/env-admin — Diagnóstico de envs (oculto en producción)       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - En desarrollo: ayuda a verificar que .env.local cargó bien.               │
 * │ - En producción: devuelve 404 (no dejamos datos de entorno expuestos).      │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";

function sha8(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 8);
}

export async function GET() {
  // 🔒 Cerramos este endpoint en producción
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // En dev: mostramos longitudes y hash corto (SIN revelar secretos)
  const RAW_PASS = process.env.ADMIN_PASS ?? "";
  const RAW_KEY  = process.env.ADMIN_ACCESS_KEY ?? "";
  const PASS = RAW_PASS.trim();
  const KEY  = RAW_KEY.trim();
  const expected = (KEY || PASS).trim();

  return NextResponse.json({
    has_PASS: Boolean(RAW_PASS.length),
    has_KEY: Boolean(RAW_KEY.length),
    pass_len: PASS.length,
    key_len: KEY.length,
    expected_len: expected.length,
    pass_hash8: PASS ? sha8(PASS) : null,
    key_hash8: KEY ? sha8(KEY) : null,
    expected_hash8: expected ? sha8(expected) : null,
  });
}
