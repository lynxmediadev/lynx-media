import Link from "next/link";
import { requireRole } from "@/lib/account-auth/guards";

export default async function CreatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(["CREATOR"], { redirectTo: "/auth/login?next=/creator/tracks" });
  if (!user) return null;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Creator Panel</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/creator/tracks"
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              Tracks
            </Link>
            <Link
              href="/creator/requests"
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              Requests
            </Link>
            <form method="POST" action="/auth/logout">
              <button className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
