import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type LabeledSelectOption = {
  value: string;
  label: string;
};

type LabeledSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: LabeledSelectOption[];
  labelPosition?: "top" | "bottom";
  rootClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
};

export function LabeledSelect({
  label,
  options,
  labelPosition = "top",
  className,
  rootClassName,
  labelClassName,
  selectClassName,
  ...props
}: LabeledSelectProps) {
  const labelNode = (
    <span
      className={cn(
        "text-center text-[10px] font-semibold tracking-wide uppercase text-muted-foreground",
        labelClassName,
      )}
    >
      {label}
    </span>
  );

  return (
    <div className={cn("grid gap-1", rootClassName)}>
      {labelPosition === "top" ? labelNode : null}
      <div className="relative">
        <select
          {...props}
          className={cn(
            "h-9 w-full appearance-none rounded-md border border-border bg-background pl-3 pr-9 text-sm",
            selectClassName,
            className,
          )}
        >
          {options.map((option) => (
            <option key={`${option.value}-${option.label}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {labelPosition === "bottom" ? labelNode : null}
    </div>
  );
}
