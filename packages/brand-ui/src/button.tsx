import type { ButtonHTMLAttributes, ReactNode } from "react";

type BrandButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

export function BrandButton({
  children,
  className,
  variant = "primary",
  ...rest
}: BrandButtonProps) {
  const variantClass = variant === "ghost" ? "brand-button-ghost" : "brand-button-primary";
  const rootClass = className ? `brand-button ${variantClass} ${className}` : `brand-button ${variantClass}`;
  return (
    <button className={rootClass} {...rest}>
      {children}
    </button>
  );
}
