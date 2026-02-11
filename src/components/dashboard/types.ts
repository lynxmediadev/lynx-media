import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  section: string;
  featureFlag?: string;
  disabled?: boolean;
  exact?: boolean;
};

export type DashboardSection = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};
