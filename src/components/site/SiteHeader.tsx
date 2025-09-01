/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/site/SiteHeader.tsx                                 │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Encabezado público minimal, pensado para estética "cine": logo/título     │
 * │   centrado, navegación breve (Catálogo, Acerca, Contacto).                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Es un Server Component (no usa estado).                                   │
 * │ - Mantiene alto contraste con tu tema dark por defecto.                     │
 * │ - La navegación es simbólica; puedes enlazar cuando existan esas páginas.   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Branding: título sobrio tipo cartelera */}
        <Link href="/" className="font-semibold tracking-wide text-zinc-100">
          LYNX · MEDIA
        </Link>

        {/* Navegación corta (placeholder por ahora) */}
        <nav className="hidden gap-5 text-sm text-zinc-300 md:flex">
          <Link className="hover:text-zinc-100" href="/tracks">
            Catálogo
          </Link>
          <Link className="hover:text-zinc-100" href="/about">
            Acerca
          </Link>
          <Link className="hover:text-zinc-100" href="/contact">
            Contacto
          </Link>
        </nav>
      </div>
    </header>
  );
}
