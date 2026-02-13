"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import ThemeToggle from "@/components/site/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { DashboardContent } from "./DashboardContent";
import { DashboardTopbar } from "./DashboardTopbar";
import { DashboardMobileSidebar, DashboardSidebar } from "./DashboardSidebar";
import type { DashboardCrumb } from "./DashboardBreadcrumbs";
import type { DashboardNavItem, DashboardSection } from "./types";

function isActivePath(pathname: string, item: DashboardNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isLikelyId(segment: string): boolean {
  return /^[a-z0-9]{10,}$/i.test(segment);
}

function humanize(segment: string): string {
  if (isLikelyId(segment)) return segment;

  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildBreadcrumbs(
  pathname: string,
  activeItem?: DashboardNavItem,
): DashboardCrumb[] {
  const crumbs: DashboardCrumb[] = [{ label: "Admin", href: "/admin" }];

  if (activeItem && activeItem.href !== "/admin") {
    crumbs.push({ label: activeItem.label, href: activeItem.href });
  }

  if (!activeItem) return crumbs;

  const remainder = pathname.replace(activeItem.href, "");
  const extraSegments = remainder
    .split("/")
    .filter(Boolean);

  for (const seg of extraSegments) {
    crumbs.push({ label: humanize(seg) });
  }

  return crumbs;
}

function shouldHideShell(pathname: string, hiddenPaths: string[]): boolean {
  return hiddenPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function DashboardShell({
  sections,
  brandTitle,
  brandSubtitle,
  children,
  hiddenPaths = ["/admin/login"],
}: {
  sections: DashboardSection[];
  brandTitle: string;
  brandSubtitle?: string;
  children: React.ReactNode;
  hiddenPaths?: string[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const allItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  const activeItem = useMemo(() => {
    const matches = allItems.filter((item) => isActivePath(pathname, item));
    if (!matches.length) return undefined;
    return matches.sort((a, b) => b.href.length - a.href.length)[0];
  }, [allItems, pathname]);

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(pathname, activeItem),
    [pathname, activeItem],
  );
  const isTrackEditRoute =
    pathname.startsWith("/admin/tracks/") && pathname.includes("/edit");
  const dashboardContentClass = isTrackEditRoute ? "pb-0" : undefined;

  const topbarActions = (
    <>
      <Button asChild variant="secondary" size="sm" className="hidden h-8 sm:inline-flex">
        <Link href="/">Sitio publico</Link>
      </Button>

      <ThemeToggle />

      <form method="POST" action="/admin/logout" className="hidden sm:block">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="border-border h-8 text-xs"
        >
          Cerrar sesion
        </Button>
      </form>
    </>
  );

  const mobileSidebarActions = (
    <div className="space-y-2">
      <Button asChild variant="secondary" size="sm" className="h-9 w-full">
        <Link href="/">Sitio publico</Link>
      </Button>

      <div className="flex items-center justify-between gap-2">
        <ThemeToggle />
        <form method="POST" action="/admin/logout" className="flex-1">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-border h-9 w-full text-xs"
          >
            Cerrar sesion
          </Button>
        </form>
      </div>
    </div>
  );

  if (shouldHideShell(pathname, hiddenPaths)) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen">
        <DashboardSidebar
          sections={sections}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          brandTitle={brandTitle}
          brandSubtitle={brandSubtitle}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar
            title={activeItem?.label ?? "Admin"}
            breadcrumbs={breadcrumbs}
            onOpenMobile={() => setMobileOpen(true)}
            actions={topbarActions}
          />

          <DashboardContent className={dashboardContentClass}>
            {children}
          </DashboardContent>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetTitle className="sr-only">Menu de navegacion admin</SheetTitle>
          <DashboardMobileSidebar
            sections={sections}
            brandTitle={brandTitle}
            brandSubtitle={brandSubtitle}
            onNavigate={() => setMobileOpen(false)}
            footerActions={mobileSidebarActions}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
