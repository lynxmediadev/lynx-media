import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminListPanel } from "./AdminListPanel";

type AdminFilterPanelProps = {
  title: ReactNode;
  statusSlot?: ReactNode;
  actionSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminFilterPanel({
  title,
  statusSlot,
  actionSlot,
  children,
  className,
}: AdminFilterPanelProps) {
  return (
    <AdminListPanel className={className}>
      <div className="mb-2 flex min-h-8 flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
            {title}
          </span>
          {statusSlot ? <>{statusSlot}</> : null}
        </div>
        {actionSlot ? <div className={cn("inline-flex items-center gap-2")}>{actionSlot}</div> : null}
      </div>
      {children}
    </AdminListPanel>
  );
}
