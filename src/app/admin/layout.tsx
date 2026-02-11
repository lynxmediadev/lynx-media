import type { Metadata } from "next";

import { AdminDashboardLayoutClient } from "@/components/admin/AdminDashboardLayoutClient";

export const metadata: Metadata = {
  title: "Panel admin — Lynx Media",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminDashboardLayoutClient>{children}</AdminDashboardLayoutClient>;
}
