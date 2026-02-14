import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminControlsRowProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function AdminControlsRow({ children, className, innerClassName }: AdminControlsRowProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className={cn("flex min-w-max items-end gap-2", innerClassName)}>{children}</div>
    </div>
  );
}
