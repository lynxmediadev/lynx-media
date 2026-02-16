import type { ReactNode } from "react";

type BrandPanelProps = {
  children: ReactNode;
  className?: string;
};

export function BrandPanel({ children, className }: BrandPanelProps) {
  const rootClass = className ? `brand-panel ${className}` : "brand-panel";
  return <section className={rootClass}>{children}</section>;
}
