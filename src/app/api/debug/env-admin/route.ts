// src/app/api/debug/env-admin/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ GET /api/debug/env-admin — Diagnóstico de variables de entorno (seguro)     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - No expone la clave. Muestra solo longitud y hash corto (8 chars).         │
 * │ - Útil para confirmar que .env.local fue cargado correctamente.             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";

function sha8(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 8);
}

export async function GET() {
  const ENV_PASS_RAW = process.env.ADMIN_PASS ?? "";
  const ENV_KEY_RAW  = process.env.ADMIN_ACCESS_KEY ?? "";

  const ENV_PASS = ENV_PASS_RAW.trim();
  const ENV_KEY  = ENV_KEY_RAW.trim();
  const expected = (ENV_KEY || ENV_PASS).trim();

  return NextResponse.json({
    has_PASS: Boolean(ENV_PASS_RAW.length),
    has_KEY: Boolean(ENV_KEY_RAW.length),
    pass_len: ENV_PASS.length,
    key_len: ENV_KEY.length,
    expected_len: expected.length,
    pass_hash8: ENV_PASS ? sha8(ENV_PASS) : null,
    key_hash8: ENV_KEY ? sha8(ENV_KEY) : null,
    expected_hash8: expected ? sha8(expected) : null,
  });
}
