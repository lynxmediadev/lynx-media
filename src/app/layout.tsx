// src/app/layout.tsx
import "./../styles/globals.css";
import type { Metadata } from "next";
import Script from "next/script";

// Fuentes globales (ajusta según tu src/app/fonts.ts)
import { inter, lato, hankenGrotesk /* , hkGuise */ } from "./fonts";

// Wrapper cliente para renderizar el toggle sólo en cliente (evita SSR del botón)
import ClientOnly from "@/components/common/ClientOnly";
import ThemeToggle from "@/components/common/ThemeToggle";

// Proveedor pasante: si tienes uno real, reemplázalo 1:1 sin tocar el JSX.
function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const metadata: Metadata = {
  title: "Lynx Media",
  description: "Sync licensing portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Opción A (por defecto): cuerpo con Hanken Grotesk
  const fontVars = `${inter.variable} ${lato.variable} ${hankenGrotesk.variable}`;
  // Opción B (si usas HK Guise):
  // const fontVars = `${inter.variable} ${lato.variable} ${hkGuise.variable}`;

  return (
    <html lang="es" className={fontVars} suppressHydrationWarning>
      <head>
        {/* No-flash: fija 'dark' en <html> antes de hidratar (en <head>) */}
        <Script id="theme-no-flash" strategy="beforeInteractive">{`
          (function () {
            try {
              var stored = localStorage.getItem('theme');
              var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var theme = (stored === 'dark' || stored === 'light') ? stored : (prefersDark ? 'dark' : 'light');
              if (theme === 'dark') document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch (e) { /* noop */ }
          })();
        `}</Script>
      </head>
      <body className="antialiased">
        <AppThemeProvider>
          {/* El contenido dentro de ClientOnly no se SSR-renderiza ⇒ sin mismatch */}
          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}
