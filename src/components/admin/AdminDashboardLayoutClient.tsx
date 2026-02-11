"use client";

import { adminDashboardSections } from "@/components/dashboard/nav-config.admin";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export function AdminDashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      sections={adminDashboardSections}
      brandTitle="Lynx Admin"
      brandSubtitle="Sync · Catalogo · Tech"
      hiddenPaths={["/admin/login"]}
    >
      {children}
    </DashboardShell>
  );
}
