"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { creatorDashboardSections } from "@/components/dashboard/nav-config.creator";
import { ViewAsControl } from "@/components/dashboard/ViewAsControl";
import type { UserRole } from "@prisma/client";

export function CreatorDashboardLayoutClient({
  role,
  realRole,
  children,
}: {
  role: UserRole | null;
  realRole: UserRole | null;
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      sections={creatorDashboardSections}
      brandTitle="Lynx Creator"
      brandSubtitle="Catalog · Requests"
      rootCrumb={{ label: "Creator", href: "/creator" }}
      logoutAction="/auth/logout"
      mobileMenuTitle="Menu de navegacion creator"
      topbarCustomActions={<ViewAsControl realRole={realRole} effectiveRole={role} />}
      mobileFooterCustomActions={
        <ViewAsControl realRole={realRole} effectiveRole={role} compact />
      }
    >
      {children}
    </DashboardShell>
  );
}
