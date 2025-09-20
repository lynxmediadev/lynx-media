// src/lib/auth.ts
/**
 * Firma/verifica token HMAC base64url con exp (para cookie admin_session).
 */
import crypto from "node:crypto";
export type AdminPayload = { u: "admin"; iat: number; exp: number };
const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const b64urlStr = (s: string) => b64url(Buffer.from(s,"utf8"));

export function signAdminToken(payload: AdminPayload, secret: string): string {
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  return `${payloadB64}.${b64url(sig)}`;
}
