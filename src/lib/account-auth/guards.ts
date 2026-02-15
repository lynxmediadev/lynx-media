import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  APP_SESSION_COOKIE,
  VIEW_AS_ROLE_COOKIE,
  getSessionUserFromCookie,
  normalizeViewAsRole,
} from "@/lib/account-auth/session";
import { verifyAdminTokenV1 } from "@/lib/auth";

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUserFromCookie>>>;
type EffectiveSessionUser = SessionUser & {
  realRole: UserRole;
  viewAsRole: UserRole | null;
  isViewAsActive: boolean;
};

export async function getCurrentUser() {
  const c = await cookies();
  const rawSession = c.get(APP_SESSION_COOKIE)?.value;
  const user = await getSessionUserFromCookie(rawSession);
  if (!user) return null;

  const viewAsRole = normalizeViewAsRole(c.get(VIEW_AS_ROLE_COOKIE)?.value);
  const canViewAs = user.role === "ADMIN" && viewAsRole && viewAsRole !== "ADMIN";

  const effectiveRole = canViewAs ? viewAsRole : user.role;
  return {
    ...user,
    role: effectiveRole,
    realRole: user.role,
    viewAsRole: canViewAs ? viewAsRole : null,
    isViewAsActive: Boolean(canViewAs),
  } satisfies EffectiveSessionUser;
}

export async function requireAuth(options?: { redirectTo?: string }) {
  const user = await getCurrentUser();
  if (user) return user;
  if (options?.redirectTo) {
    redirect(options.redirectTo);
  }
  return null;
}

export async function requireRole(roles: UserRole[], options?: { redirectTo?: string }) {
  const user = await getCurrentUser();
  if (user && roles.includes(user.role)) return user;
  if (options?.redirectTo) {
    redirect(options.redirectTo);
  }
  return null;
}

export async function requireAdminOrStaffAction() {
  const user = await getCurrentUser();
  if (user && (user.role === "ADMIN" || user.role === "STAFF")) return user;

  // Compatibilidad temporal: admin legacy por cookie firmada.
  const c = await cookies();
  const legacyToken = c.get("admin_session")?.value ?? "";
  const legacySecret = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  if (legacyToken && legacySecret) {
    const payload = verifyAdminTokenV1(legacyToken, legacySecret);
    if (payload?.sub === "admin") {
      return { id: "legacy-admin", role: "ADMIN" as const };
    }
  }

  throw new Error("Unauthorized");
}

export function canAccessOwnerResource(
  user: Pick<SessionUser, "id" | "role">,
  ownerUserId: string | null | undefined,
) {
  if (user.role === "ADMIN" || user.role === "STAFF") return true;
  if (!ownerUserId) return false;
  return ownerUserId === user.id;
}
