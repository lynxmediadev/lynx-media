"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CatalogLayoutProps {
  children: ReactNode;
}

/**
 * Shell de aplicación para /catalog inspirado en Supabase:
 * - Sidebar oscuro fijo (bg #2e2e2e).
 * - Área principal clara (bg #F8F9FA) con header y contenido tipo dashboard.
 * - Sidebar y main tienen scroll independiente (h-screen).
 * - Se neutraliza el borde global con border-0/border-none en contenedores clave.
 */
export default function CatalogLayout({ children }: CatalogLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Catálogo", href: "/catalog", disabled: false },
    { label: "Servicios", href: "/services", disabled: true },
    { label: "Sobre Lynx", href: "/about", disabled: true },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FA] text-[#11181C] border-0">
      <div className="flex h-full border-0">
        {/* SIDEBAR – oscuro, fijo, con su propio scroll */}
        <aside
          className="
            hidden
            md:flex md:flex-col
            md:fixed md:inset-y-0 md:w-64
            bg-[#171717] text-slate-100
            border-0 border-r border-black/20
            scroll-region overflow-y-auto
          "
        >
          {/* Branding simple tipo Supabase */}
          <div className="flex h-14 items-center gap-2 border-0 border-b border-white/5 px-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3ECF8E] text-xs font-bold text-[#11181C]">
              LM
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wide">
                Lynx Media
              </span>
              <span className="text-[11px] text-slate-400">
                Catálogo para Sync
              </span>
            </div>
          </div>

          {/* Navegación principal */}
          <nav className="flex-1 space-y-4 border-0 px-3 py-4 text-sm">
            <div>
              <p className="px-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
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
                        className={`${baseClasses} cursor-not-allowed text-slate-500`}
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
                          ? "bg-[#3ECF8E]/10 text-white"
                          : "text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#3ECF8E]">
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
          <div className="border-0 border-t border-white/10 px-5 py-4 text-[11px] text-slate-400">
            <p className="font-medium text-slate-200">Modo demo</p>
            <p>
              Vista pública en construcción. Datos mock mientras definimos UI y
              conectamos el modelo Track.
            </p>
          </div>
        </aside>

        {/* MAIN – header + contenido claro */}
        <div className="flex h-full flex-1 flex-col border-0 md:pl-64">
          {/* Header superior tipo app-bar (claro) */}
          <header className="border-0 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Catálogo público
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  Biblioteca para cine, TV, publicidad y juegos
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Search compacta tipo Supabase (placeholder, sin lógica aún) */}
                <div className="hidden items-center rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-500 shadow-sm sm:flex">
                  <span className="mr-2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar título, artista, mood…"
                    className="w-56 border-0 bg-transparent py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                {/* Badge de modo demo (verde Supabase) */}
                <span className="inline-flex items-center gap-1 rounded-full border border-[#3ECF8E]/40 bg-[#3ECF8E]/10 px-3 py-1 text-[11px] font-medium text-[#3ECF8E]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3ECF8E]" />
                  Modo demo
                </span>
              </div>
            </div>
          </header>

          {/* Contenido scrollable claro */}
          <main className="scroll-region flex-1 overflow-y-auto bg-[#F8F9FA]">
            <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
