import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { APP_SESSION_COOKIE, clearSessionCookie, destroyUserSessionByCookie } from "@/lib/account-auth/session";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

export async function POST(req: NextRequest) {
  const c = await cookies();
  const rawSession = c.get(APP_SESSION_COOKIE)?.value;

  await destroyUserSessionByCookie(rawSession);
  await clearSessionCookie();

  return NextResponse.redirect(redirectUrl(req, "/auth/login"), { status: 303 });
}
