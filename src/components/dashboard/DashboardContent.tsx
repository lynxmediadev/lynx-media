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
      className={cn("w-full px-4 py-6 md:px-12", className)}
    >
      {children}
    </div>
  );
}
