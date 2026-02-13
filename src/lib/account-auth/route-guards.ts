import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { APP_SESSION_COOKIE, getSessionUserFromCookie } from "@/lib/account-auth/session";

export async function getRouteUser() {
  const cookieStore = await cookies();
  return getSessionUserFromCookie(cookieStore.get(APP_SESSION_COOKIE)?.value);
}

export async function requireRouteAdmin() {
  const user = await getRouteUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export function safeRouteRedirect(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

