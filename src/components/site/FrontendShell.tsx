"use client";

/**
 * src/components/site/FrontendShell.tsx
 * =========================================================
 * PERAS Y MANZANAS (qué hace este archivo)
 * - Es el “cascarón” público del sitio.
 * - Decide si muestra el header (lo oculta en /admin y /catalog).
 * - Mantiene estructura simple: header arriba + main abajo.
 * - NO implementa Snap; Snap vive solo en el homepage (page.tsx).
 * =========================================================
 */

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";

interface FrontendShellProps {
  children: ReactNode;
}

export default function FrontendShell({ children }: FrontendShellProps) {
  const pathname = usePathname();

  const hideHeader =
    pathname.startsWith("/catalog") || pathname.startsWith("/admin");

  return (
    <div className="min-h-dvh">
      {!hideHeader && <SiteHeader />}
      <main>{children}</main>
    </div>
  );
}
