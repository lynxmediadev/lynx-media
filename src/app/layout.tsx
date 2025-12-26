// src/app/layout.tsx
import "./../styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// Fuentes globales (según tu src/app/fonts.ts)
import { inter, lato, hankenGrotesk, dancingScript, anton } from "./fonts";

import SmoothScroll from "@/components/common/SmoothScroll";
import FrontendShell from "@/components/site/FrontendShell";

function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Scroll suave global (client component) */}
      <SmoothScroll />
      {/* Shell público que decide si muestra navbar o no */}
      <FrontendShell>{children}</FrontendShell>
    </>
  );
}

export const metadata: Metadata = {
  title: "Lynx Media — Sync Licensing",
  description: "Catálogo y servicios de música para cine/TV/publicidad.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontVars = `${inter.variable} ${lato.variable} ${hankenGrotesk.variable} ${dancingScript.variable} ${anton.variable}`;

  return (
    <html lang="es" className={`${fontVars} dark`} suppressHydrationWarning>
      <body className="antialiased">
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
