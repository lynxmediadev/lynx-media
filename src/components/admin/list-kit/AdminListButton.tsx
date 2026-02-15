import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const adminListButtonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md border border-border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      tone: {
        default: "hover:bg-muted/45",
        danger:
          "border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20",
      },
      size: {
        row: "h-8 px-2.5 text-xs",
        rowIcon: "h-8 w-8 text-xs",
        control: "h-9 px-3 text-sm",
        controlIcon: "h-9 w-9 text-sm",
        pill: "h-auto rounded-full px-2 py-1 text-[11px] capitalize",
      },
      surface: {
        none: "",
        background: "bg-background",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "row",
      surface: "none",
    },
  },
);

type AdminListButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof adminListButtonVariants> & {
    asChild?: boolean;
  };

export function AdminListButton({
  className,
  tone,
  size,
  surface,
  asChild = false,
  ...props
}: AdminListButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        adminListButtonVariants({ tone, size, surface }),
        className,
      )}
      {...props}
    />
  );
}

export { adminListButtonVariants };
