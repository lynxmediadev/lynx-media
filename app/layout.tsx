import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lynx Media",
  description: "Landing pública de Lynx Media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

