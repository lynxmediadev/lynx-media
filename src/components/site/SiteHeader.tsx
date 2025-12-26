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
 * - Usa tokens/clases semánticas definidas en globals.css.
 * - Incluye CTA hacia catálogo y contacto.
 */
export default function SiteHeader() {
  return (
    <header className="lm-header">
      <div className="lm-container flex items-center justify-between gap-4 py-3">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-3">
          <div className="lm-brand-badge">
            <span className="text-foreground text-[16px] font-semibold tracking-[0.18em]">
              LM
            </span>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-foreground text-sm font-black">
              Lynx Media
            </span>
            <p className="text-muted-foreground text-[10px]">
              Audio Profesional
            </p>
            <p className="text-muted-foreground text-[10px]">
              Música Original para Cine, TV y Marcas
            </p>
          </div>
        </Link>

        {/* Navegación principal (desktop) */}
        <nav className="lm-nav">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className="lm-navlink">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <Link
            href="/catalog"
            className="border-border text-foreground hover:border-primary hidden rounded-full border px-3 py-1.5 text-xs font-medium transition-colors md:inline-flex"
          >
            Ver catálogo
          </Link>

          <Link
            href="/contact"
            className="lm-btn lm-btn-primary px-3.5 py-1.5 text-xs font-semibold"
          >
            Agenda una reunión
          </Link>
        </div>
      </div>
    </header>
  );
}
