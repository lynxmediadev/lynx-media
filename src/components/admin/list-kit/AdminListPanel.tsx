import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminListPanelProps = {
  children: ReactNode;
  className?: string;
};

export function AdminListPanel({ children, className }: AdminListPanelProps) {
  return <div className={cn("h-full rounded-lg border border-border/70 bg-background/40 px-2.5 py-2", className)}>{children}</div>;
}

