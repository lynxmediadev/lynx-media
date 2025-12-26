"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";

interface FrontendShellProps {
  children: ReactNode;
}

/**
 * Shell público del frontend:
 * - Aplica fondo y tipografía base.
 * - Muestra el SiteHeader en rutas públicas.
 * - Oculta el header en /catalog y /admin (que tienen sus propios layouts).
 */
export default function FrontendShell({ children }: FrontendShellProps) {
  const pathname = usePathname();

  const hideHeader =
    pathname.startsWith("/catalog") || pathname.startsWith("/admin");

  return (
    <div className="lm-page">
      {!hideHeader && <SiteHeader />}
      <main>{children}</main>
    </div>
  );
}
