import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminControlsRowProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function AdminControlsRow({ children, className, innerClassName }: AdminControlsRowProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex w-full flex-wrap items-end gap-2", innerClassName)}>{children}</div>
    </div>
  );
}
