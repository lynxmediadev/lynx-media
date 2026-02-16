import "server-only";
import { NextRequest } from "next/server";
import { verifyAdminTokenV1 } from "@/lib/auth";
import { APP_SESSION_COOKIE, getSessionUserFromCookie } from "@/lib/account-auth/session";
import { prisma } from "@/lib/prisma";

type AuthRequestUser =
  | { id: string; role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT"; source: "session" }
  | { id: string | null; role: "ADMIN"; source: "legacy" };

export async function getRequestAuthUser(req: NextRequest): Promise<AuthRequestUser | null> {
  const appSessionRaw = req.cookies.get(APP_SESSION_COOKIE)?.value;
  if (appSessionRaw) {
    const user = await getSessionUserFromCookie(appSessionRaw);
    if (user) {
      return { id: user.id, role: user.role, source: "session" };
    }
  }

  const legacySecret = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  if (legacySecret) {
    const legacyRaw = req.cookies.get("admin_session")?.value ?? "";
    const payload = verifyAdminTokenV1(legacyRaw, legacySecret);
    if (payload?.sub === "admin") {
      return { id: null, role: "ADMIN", source: "legacy" };
    }
  }

  return null;
}

export async function canAccessTrackByRole(
  user: AuthRequestUser,
  trackId: string,
): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "STAFF") return true;
  if (!user.id) return false;

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { ownerUserId: true },
  });
  if (!track) return false;
  return track.ownerUserId === user.id;
}
