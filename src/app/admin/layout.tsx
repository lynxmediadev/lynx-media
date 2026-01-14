// src/app/admin/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";

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
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-baseline gap-2">
            <Link
              href="/admin/licensing"
              className="text-sm font-semibold tracking-wide uppercase"
            >
              Lynx Admin
            </Link>
            <span className="text-xs text-muted-foreground">
              Sync · Catálogo · Tech
            </span>
          </div>

          <nav className="flex items-center gap-4 text-xs md:text-sm">
            <Link href="/admin/uploads" className="hover:underline">
              Upload Track
            </Link>
            <Link href="/admin/tracks" className="hover:underline">
              Tracks
            </Link>
            <Link href="/admin/licensing" className="hover:underline">
              Licensing
            </Link>

            <form method="POST" action="/admin/logout">
              <button
                type="submit"
                className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cerrar sesión
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
