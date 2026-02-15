import { requireRole } from "@/lib/account-auth/guards";
import { CreatorDashboardLayoutClient } from "@/components/creator/CreatorDashboardLayoutClient";

export default async function CreatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await requireRole(["CREATOR"], { redirectTo: "/auth/login?next=/creator/tracks" });
  if (!currentUser) return null;

  return (
    <CreatorDashboardLayoutClient
      role={currentUser.role}
      realRole={currentUser.realRole ?? currentUser.role}
    >
      {children}
    </CreatorDashboardLayoutClient>
  );
}
