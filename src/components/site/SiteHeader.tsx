// src/components/site/SiteHeader.tsx

import Link from "next/link";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/services", label: "Servicios" },
  { href: "/about", label: "Estudio" },
  { href: "/contact", label: "Contacto" },
];

/**
 * Encabezado público global:
 * - Navbar minimal, sobrio y elegante.
 * - Usa tokens de color definidos en globals.css (var(--color-*), var(--border), etc.).
 * - Incluye CTA hacia catálogo y contacto.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--color-dark)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--color-dark)]">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-[var(--accent-foreground)]">
              LM
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Lynx Media
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Audio & sync para cine, TV y marcas
            </span>
          </div>
        </Link>

        {/* Navegación principal (desktop) */}
        <nav className="hidden items-center gap-6 text-xs font-medium text-[var(--muted-foreground)] md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <Link
            href="/catalog"
            className="hidden rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-foreground)] md:inline-flex"
          >
            Ver catálogo
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent-foreground)] transition-transform transition-colors hover:scale-[1.02] hover:bg-[var(--accent)]"
          >
            Agenda una llamada
          </Link>
        </div>
      </div>
    </header>
  );
}
