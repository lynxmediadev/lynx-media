"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DashboardNavItem, DashboardSection } from "./types";

function isItemActive(pathname: string, item: DashboardNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function DashboardNavList({
  sections,
  collapsed,
  onNavigate,
}: {
  sections: DashboardSection[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.id} className="space-y-2">
          <p
            className={cn(
              "text-muted-foreground px-2 text-[10px] font-semibold tracking-[0.08em] uppercase",
              collapsed && "sr-only",
            )}
          >
            {section.label}
          </p>

          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(pathname, item);
              const commonClass = cn(
                "flex items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-sm transition-colors duration-150",
                active
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:border-border hover:bg-foreground hover:text-background hover:shadow-sm",
                item.disabled && "cursor-not-allowed opacity-45",
                collapsed && "justify-center px-2",
              );

              return (
                <li key={item.id}>
                  {item.disabled ? (
                    <span
                      className={commonClass}
                      aria-disabled="true"
                      title={item.label}
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : null}
                      <span className={cn(collapsed && "sr-only")}>
                        {item.label}
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={commonClass}
                      title={item.label}
                      onClick={onNavigate}
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : null}
                      <span className={cn(collapsed && "sr-only")}>
                        {item.label}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function DashboardSidebar({
  sections,
  collapsed,
  onToggleCollapse,
  brandTitle,
  brandSubtitle,
}: {
  sections: DashboardSection[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  brandTitle: string;
  brandSubtitle?: string;
}) {
  return (
    <aside
      className={cn(
        "border-border bg-background sticky top-0 hidden h-screen border-r lg:flex lg:flex-col",
        collapsed ? "w-[84px]" : "w-[230px]",
      )}
    >
      <div className="border-border flex h-14 items-center justify-between border-b px-3">
        <div className={cn("min-w-0", collapsed && "sr-only")}>
          <p className="truncate text-sm font-semibold">{brandTitle}</p>
          {brandSubtitle ? (
            <p className="text-muted-foreground truncate text-[11px]">
              {brandSubtitle}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="h-8 w-8 shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 pr-3 pl-5">
        <DashboardNavList sections={sections} collapsed={collapsed} />
      </nav>
    </aside>
  );
}

export function DashboardMobileSidebar({
  sections,
  brandTitle,
  brandSubtitle,
  onNavigate,
}: {
  sections: DashboardSection[];
  brandTitle: string;
  brandSubtitle?: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="bg-background flex h-full flex-col">
      <div className="border-border border-b px-4 py-3">
        <p className="text-sm font-semibold">{brandTitle}</p>
        {brandSubtitle ? (
          <p className="text-muted-foreground text-xs">{brandSubtitle}</p>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 pr-3 pl-5">
        <DashboardNavList
          sections={sections}
          collapsed={false}
          onNavigate={onNavigate}
        />
      </nav>
    </div>
  );
}
