import { cn } from "@/lib/utils";

export function DashboardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col w-full px-4 py-6 md:px-12", className)}
    >
      {children}
    </div>
  );
}
