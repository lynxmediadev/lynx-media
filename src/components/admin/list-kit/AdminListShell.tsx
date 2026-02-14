import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminListShellProps = {
  children: ReactNode;
  className?: string;
};

export function AdminListShell({ children, className }: AdminListShellProps) {
  return <div className={cn("overflow-hidden rounded-xl border border-border bg-muted/10 shadow-sm", className)}>{children}</div>;
}

