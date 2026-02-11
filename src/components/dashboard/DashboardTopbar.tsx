"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DashboardBreadcrumbs,
  type DashboardCrumb,
} from "./DashboardBreadcrumbs";

export function DashboardTopbar({
  title,
  breadcrumbs,
  onOpenMobile,
  actions,
}: {
  title: string;
  breadcrumbs: DashboardCrumb[];
  onOpenMobile: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-border bg-background/92 sticky top-0 z-40 h-14 border-b backdrop-blur">
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-12">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={onOpenMobile}
            aria-label="Abrir menu de navegacion"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold md:text-base">
              {title}
            </p>
            <DashboardBreadcrumbs items={breadcrumbs} className="mt-0" />
          </div>
        </div>

        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
