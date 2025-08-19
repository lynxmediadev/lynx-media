// src/app/layout.tsx
import "./../styles/globals.css";
import type { Metadata } from "next";

// Fuentes globales (según tu src/app/fonts.ts)
import { inter, lato, hankenGrotesk, dancingScript, anton } from "./fonts";

// Proveedor pasante (si en el futuro agregas uno real, reemplázalo 1:1)
function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const metadata: Metadata = {
  title: "Lynx Media — Sync Licensing",
  description: "Catálogo y servicios de música para cine/TV/publicidad.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Carga de variables de fuente (coinciden con tus nombres reales)
  const fontVars = `${inter.variable} ${lato.variable} ${hankenGrotesk.variable} ${dancingScript.variable} ${anton.variable}`;

  return (
    <html lang="es" className={`${fontVars} dark`} suppressHydrationWarning>
      <body className="antialiased">
        <AppThemeProvider>
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}
