import type { ReactNode } from "react";

interface CatalogLayoutProps {
  children: ReactNode;
}

/**
 * Layout mínimo para catálogo público.
 * Se deja sin sidebar ni app-bar para permitir un lienzo completo al page.
 */
export default function CatalogLayout({ children }: CatalogLayoutProps) {
  return <>{children}</>;
}
