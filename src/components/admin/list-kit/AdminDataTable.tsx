import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AdminColumnDef } from "./types";

type AdminDataTableProps<T> = {
  rows: T[];
  columns: AdminColumnDef<T>[];
  rowKey: (row: T, index: number) => string;
  rowClassName?: string | ((row: T) => string);
  minWidthClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  emptyState?: ReactNode;
};

function alignClass(align: AdminColumnDef<unknown>["align"]) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function AdminDataTable<T>({
  rows,
  columns,
  rowKey,
  rowClassName,
  minWidthClassName = "min-w-full",
  tableClassName,
  headerClassName,
  emptyState,
}: AdminDataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className={cn(minWidthClassName, "text-sm", tableClassName)}>
        <thead className={cn("bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground", headerClassName)}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-3 py-2 sm:px-4",
                  alignClass(column.align),
                  column.hideOnMobile && "hidden md:table-cell",
                  column.widthClassName,
                  column.headerClassName,
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              className={cn(
                "border-t border-border align-top transition-colors hover:bg-muted/10",
                typeof rowClassName === "function" ? rowClassName(row) : rowClassName,
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-3 py-3 sm:px-4",
                    alignClass(column.align),
                    column.hideOnMobile && "hidden md:table-cell",
                    column.cellClassName,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

