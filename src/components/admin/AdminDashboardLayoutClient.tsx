"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  adminDashboardSections,
  getAdminDashboardSectionsForRole,
} from "@/components/dashboard/nav-config.admin";
import type { UserRole } from "@prisma/client";

export function AdminDashboardLayoutClient({
  role,
  children,
}: {
  role: UserRole | null;
  children: React.ReactNode;
}) {
  const sections = role ? getAdminDashboardSectionsForRole(role) : adminDashboardSections;

  return (
    <DashboardShell
      sections={sections}
      brandTitle="Lynx Admin"
      brandSubtitle="Sync · Catalogo · Tech"
      hiddenPaths={["/admin/login"]}
    >
      {children}
    </DashboardShell>
  );
}
