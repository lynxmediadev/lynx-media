import Link from "next/link";

import { cn } from "@/lib/utils";

export type DashboardCrumb = {
  label: string;
  href?: string;
};

export function DashboardBreadcrumbs({
  items,
  className,
}: {
  items: DashboardCrumb[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-xs", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span
            key={`${item.label}-${index}`}
            className="flex items-center gap-1"
          >
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "text-foreground" : "text-muted-foreground"}
              >
                {item.label}
              </span>
            )}
            {!isLast ? (
              <span className="text-muted-foreground/60">/</span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
