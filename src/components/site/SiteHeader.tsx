/**
 * src/components/site/SiteHeader.tsx
 * =========================================================
 * PERAS Y MANZANAS (qué hace este archivo)
 * - Header visible en el sitio público.
 * - Es sticky para que se mantenga presente mientras navegas/paneles del home.
 * - Incluye navegación a secciones del homepage usando anchors (#services, etc.).
 * - Incluye un toggle de tema (dark ↔ light) mediante ThemeToggle.
 *
 * Nota: No usamos overlay. El header ocupa espacio normal y su altura se
 * controla por el token --header-h para que el Snap calcule bien el viewport.
 * =========================================================
 */

import Link from "next/link";
import ThemeToggle from "@/components/site/ThemeToggle";

const homeAnchors = [
  { href: "/#hero", label: "Inicio" },
  { href: "/#services", label: "Servicios" },
  { href: "/#catalog", label: "Catálogo" },
  { href: "/#portfolio", label: "Portafolio" },
  { href: "/#contact", label: "Contacto" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4"
        style={{ height: "var(--header-h)" }}
      >
        {/* Branding */}
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-wide">Lynx Media</span>
          <span className="text-[11px] text-muted-foreground">
            Música · Sonido · Producción
          </span>
        </Link>

        {/* Nav (desktop) */}
        <nav className="hidden items-center gap-6 md:flex">
          {homeAnchors.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <Link
            href="/catalog"
            className="hidden rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent md:inline-flex"
          >
            Ver catálogo
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
