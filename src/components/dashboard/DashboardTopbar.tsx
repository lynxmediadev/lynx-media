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
    <header className="border-border bg-background/92 sticky top-0 z-40 min-h-14 border-b backdrop-blur md:h-14">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 md:h-full md:px-12 md:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-2">
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
            <DashboardBreadcrumbs items={breadcrumbs} className="mt-0 max-w-full" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
