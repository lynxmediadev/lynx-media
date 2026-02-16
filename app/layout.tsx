import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { inter, lato, hankenGrotesk, dancingScript, anton } from "../../../src/app/fonts";

export const metadata: Metadata = {
  title: "Lynx Media — Landing",
  description: "Landing pública de Lynx Media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const fontVars = `${inter.variable} ${lato.variable} ${hankenGrotesk.variable} ${dancingScript.variable} ${anton.variable}`;

  return (
    <html lang="es" className={fontVars} suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
