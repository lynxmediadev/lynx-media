// src/app/admin/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";

import ThemeToggle from "@/components/site/ThemeToggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Panel admin — Lynx Media",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 md:px-6"
          style={{ height: "var(--header-h)" }}
        >
          <div className="flex flex-col leading-tight">
            <Link
              href="/admin/tracks"
              className="text-sm font-semibold tracking-wide uppercase"
            >
              Lynx Admin
            </Link>
            <span className="text-[11px] text-muted-foreground">
              Sync · Catalogo · Tech
            </span>
          </div>

          <nav className="flex items-center gap-4 text-xs md:text-sm">
            <Button asChild variant="secondary" size="sm" className="h-8">
              <Link href="/">Sitio público</Link>
            </Button>
            <Link
              href="/admin/uploads"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Upload Track
            </Link>
            <Link
              href="/admin/tracks"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Tracks
            </Link>
            <Link
              href="/admin/licensing"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Licensing
            </Link>

            <ThemeToggle />

            <form method="POST" action="/admin/logout">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 border-border text-xs"
              >
                Cerrar sesion
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
