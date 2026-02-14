import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AdminRowAction } from "./types";

type AdminTableRowActionsProps<T> = {
  row: T;
  actions: AdminRowAction<T>[];
  className?: string;
};

export function AdminTableRowActions<T>({ row, actions, className }: AdminTableRowActionsProps<T>) {
  const visible = actions.filter((action) => (action.visible ? action.visible(row) : true));

  if (visible.length === 0) return null;

  return (
    <div className={cn("inline-flex items-center justify-end gap-2", className)}>
      {visible.map((action) => {
        const content: ReactNode = (
          <>
            {action.icon ? <span className="h-3.5 w-3.5">{action.icon}</span> : null}
            <span>{action.label}</span>
          </>
        );

        const buttonClass = cn(
          "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-muted/45",
          action.intent === "danger" && "border-destructive/40 text-destructive hover:bg-destructive/10",
        );

        if (action.href) {
          return (
            <Link key={action.id} href={action.href(row)} className={buttonClass}>
              {content}
            </Link>
          );
        }

        return (
          <button key={action.id} type="button" className={buttonClass} onClick={() => action.onClick?.(row)}>
            {content}
          </button>
        );
      })}
    </div>
  );
}

