// src/lib/api.ts
/**
 * api.ts — Helpers de respuesta JSON consistentes para Route Handlers
 */
import { NextResponse } from "next/server";

export function ok<T = unknown>(data?: T, init?: number | ResponseInit) {
  const initObj: ResponseInit = typeof init === "number" ? { status: init } : (init || {});
  return NextResponse.json({ ok: true, data }, initObj);
}

export function fail(error: string, init?: number | ResponseInit, extra?: Record<string, unknown>) {
  const initObj: ResponseInit = typeof init === "number" ? { status: init } : (init || {});
  return NextResponse.json({ ok: false, error, ...(extra ? { ...extra } : {}) }, initObj);
}
