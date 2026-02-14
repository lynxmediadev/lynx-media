import type { ReactNode } from "react";

export type AdminColumnAlign = "left" | "center" | "right";

export type AdminColumnDef<T> = {
  key: string;
  label: ReactNode;
  align?: AdminColumnAlign;
  widthClassName?: string;
  headerClassName?: string;
  cellClassName?: string;
  hideOnMobile?: boolean;
  render: (row: T) => ReactNode;
};

export type AdminRowAction<T> = {
  id: string;
  label: string;
  icon?: ReactNode;
  intent?: "default" | "danger";
  visible?: (row: T) => boolean;
  href?: (row: T) => string;
  onClick?: (row: T) => void;
};

export type AdminFilterSchema = {
  query?: string;
  selectors?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
};

export type AdminBulkActionSchema = {
  id: string;
  label: string;
  requiresValue?: boolean;
};

