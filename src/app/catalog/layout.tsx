"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CatalogLayoutProps {
  children: ReactNode;
}

/**
 * Layout de catálogo público (FRONTEND):
 * - Sidebar oscuro (usa tokens --lm-sidebar-*).
 * - Contenido claro (usa tokens --lm-page-* y --lm-surface-*).
 * - Estructura tipo dashboard (inspirada en Supabase).
 *
 * NOTA IMPORTANTE:
 * Si quieres cambiar colores globales del FRONTEND,
 * hazlo en src/styles/globals.css, en el bloque:
 * "Lynx Media – tokens de diseño catálogo público".
 */
export default function CatalogLayout({ children }: CatalogLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Catálogo", href: "/catalog", disabled: false },
    { label: "Servicios", href: "/services", disabled: true },
    { label: "Sobre Lynx", href: "/about", disabled: true },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[var(--lm-page-bg)] text-[var(--lm-text-main)] border-0">
      <div className="flex h-full border-0">
        {/* SIDEBAR – oscuro, fijo, con su propio scroll */}
        <aside
          className="
            hidden
            md:flex md:flex-col
            md:fixed md:inset-y-0 md:w-64
            text-slate-100
            border-0 border-r
            scroll-region overflow-y-auto
          "
          style={{
            backgroundColor: "var(--lm-sidebar-bg)",
            borderColor: "var(--lm-sidebar-border)",
          }}
        >
          {/* Branding */}
          <div className="flex h-16 items-center gap-2 border-0 border-b border-white/10 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--lm-accent)] text-xs font-bold text-[var(--lm-sidebar-bg)]">
              LM
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wide">
                Lynx Media
              </span>
              <span className="text-[11px] text-slate-300">
                Catálogo para Sync
              </span>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 space-y-4 border-0 px-3 py-4 text-sm">
            <div>
              <p className="px-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300">
                Navegación
              </p>
              <div className="mt-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const baseClasses =
                    "flex items-center justify-between rounded-md px-3 py-2 text-xs transition border-0";

                  if (item.disabled) {
                    return (
                      <div
                        key={item.href}
                        className={`${baseClasses} cursor-not-allowed text-slate-400`}
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          Próx.
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${baseClasses} ${
                        isActive
                          ? "bg-[var(--lm-accent-soft)] text-white"
                          : "text-slate-100 hover:bg-white/10"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--lm-accent)]">
                          Actual
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Pie del sidebar – modo demo */}
          <div className="border-0 border-t border-white/10 px-5 py-4 text-[11px] text-slate-300">
            <p className="font-medium text-slate-100">Modo demo</p>
            <p>
              Vista pública en construcción. Datos mock mientras definimos UI y
              conectamos el modelo Track.
            </p>
          </div>
        </aside>

        {/* MAIN – header + contenido claro */}
        <div className="flex h-full flex-1 flex-col border-0 md:pl-64">
          {/* Header superior tipo app-bar */}
          <header className="border-0 border-b bg-[var(--lm-surface-bg)] border-[color:var(--lm-surface-border)] shadow-sm/5 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--lm-text-muted)]">
                  Catálogo público
                </span>
                <span className="text-sm font-semibold text-[var(--lm-text-main)]">
                  Biblioteca para cine, TV, publicidad y juegos
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Search compacta (por ahora solo visual) */}
                <div className="hidden items-center rounded-md border border-[color:var(--lm-surface-border)] bg-slate-50 px-2 text-xs text-[var(--lm-text-muted)] shadow-sm sm:flex">
                  <span className="mr-2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar título, artista, mood…"
                    className="w-56 border-0 bg-transparent py-1 text-xs text-[var(--lm-text-main)] placeholder:text-[var(--lm-text-muted)] focus:outline-none"
                  />
                </div>

                {/* Badge Modo demo */}
                <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--lm-accent)] bg-[var(--lm-accent-soft)] px-3 py-1 text-[11px] font-medium text-[var(--lm-accent-alt)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lm-accent)]" />
                  Modo demo
                </span>
              </div>
            </div>
          </header>

          {/* Contenido scrollable */}
          <main className="scroll-region flex-1 overflow-y-auto bg-[var(--lm-page-bg)]">
            <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
