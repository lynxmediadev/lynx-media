import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminListHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  count?: ReactNode;
  statusBadge?: ReactNode;
  actionSlot?: ReactNode;
  className?: string;
};

export function AdminListHeader({
  title,
  subtitle,
  icon,
  count,
  statusBadge,
  actionSlot,
  className,
}: AdminListHeaderProps) {
  return (
    <div className={cn("border-b border-border px-3 py-3 sm:px-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle ? <span className="text-sm text-muted-foreground">{subtitle}</span> : null}
          {count ? <>{count}</> : null}
          {statusBadge ? <>{statusBadge}</> : null}
        </div>
        {actionSlot ? <>{actionSlot}</> : null}
      </div>
    </div>
  );
}

