import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminDataTable } from "./AdminDataTable";
import type { AdminColumnDef } from "./types";

type ListKitTableComposerProps<T> = {
  rows: T[];
  columns: AdminColumnDef<T>[];
  rowKey: (row: T, index: number) => string;
  rowClassName?: string | ((row: T) => string);
  filterPanel: ReactNode;
  bulkPanel?: ReactNode;
  emptyState: ReactNode;
  renderMobileRow?: (row: T, index: number) => ReactNode;
  topWrapperClassName?: string;
  topGridClassName?: string;
  mobileWrapperClassName?: string;
  desktopWrapperClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  minWidthClassName?: string;
};

export function ListKitTableComposer<T>({
  rows,
  columns,
  rowKey,
  rowClassName,
  filterPanel,
  bulkPanel,
  emptyState,
  renderMobileRow,
  topWrapperClassName,
  topGridClassName,
  mobileWrapperClassName = "space-y-3 p-3 md:hidden",
  desktopWrapperClassName,
  tableClassName,
  headerClassName,
  minWidthClassName,
}: ListKitTableComposerProps<T>) {
  const hasMobileLayout = typeof renderMobileRow === "function";

  return (
    <>
      <div
        className={cn(
          "border-border border-b px-3 py-2 sm:px-4",
          topWrapperClassName,
        )}
      >
        <div
          className={cn(
            "grid gap-2",
            bulkPanel ? "xl:grid-cols-2" : "xl:grid-cols-1",
            topGridClassName,
          )}
        >
          {filterPanel}
          {bulkPanel ?? null}
        </div>
      </div>

      {hasMobileLayout ? (
        rows.length === 0 ? (
          emptyState
        ) : (
          <div className={mobileWrapperClassName}>
            {rows.map((row, index) => renderMobileRow(row, index))}
          </div>
        )
      ) : null}

      <div
        className={cn(
          hasMobileLayout ? "hidden overflow-hidden md:block" : "overflow-hidden",
          desktopWrapperClassName,
        )}
      >
        <AdminDataTable
          rows={rows}
          columns={columns}
          rowKey={rowKey}
          rowClassName={rowClassName}
          tableClassName={tableClassName}
          headerClassName={headerClassName}
          minWidthClassName={minWidthClassName}
          emptyState={emptyState}
        />
      </div>
    </>
  );
}

