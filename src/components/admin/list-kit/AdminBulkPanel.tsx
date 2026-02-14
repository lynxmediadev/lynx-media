import type { ReactNode } from "react";
import { AdminListPanel } from "./AdminListPanel";

type AdminBulkPanelProps = {
  title: ReactNode;
  statusSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminBulkPanel({ title, statusSlot, children, className }: AdminBulkPanelProps) {
  return (
    <AdminListPanel className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
          {title}
        </span>
        {statusSlot ? <>{statusSlot}</> : null}
      </div>
      {children}
    </AdminListPanel>
  );
}

